angular.module('starter.controllers')
    .controller('MapCtrl', function($scope, $timeout, $log, $window,
                                    $ionicLoading, $ionicPlatform, $ionicModal, $ionicBackdrop, $ionicPopup,
                                    $cordovaGeolocation, $cordovaToast, StationMarker,
                                    Ref, GeofireRef, geoUtils, GeoFire, _, catalogs,
                                    mapWidgetsChannel, uiGmapIsReady, uiGmapGoogleMapApi, Auth) {
        var self = this;

        var directionsService = null;
        var directionsDisplay = null;

        // Query radius
        var radiusInKm = 10;
        var geoQuery = null;

        // Keep track of all of the stations currently within the query
        var stationsInQuery = {};
        var stationMarkers = [];

        var watchLocation = null;
        var geolocationSwitchModeAttempted = false;

        var findingNearestStation = false;
        var navigating = false;
        var startingView = true;

        var findNearestStationPopup = null;

        var geolocationOptions = { maximumAge: 2000, timeout: 15000, enableHighAccuracy: true };

        self.myLocation = {};
        self.myLocationMarker = {
            id: '1',
            icon: {
                path: 0, // 0 is equal to google.maps.SymbolPath.CIRCLE
                scale: 7,
                fillOpacity: 1,
                fillColor: '#387ef5',
                strokeColor: 'white',
                strokeWeight: 2
             },
            options: {
                clickable: false,
                visible: false
            }
        };

        self.map = {
            zoom: 7,
            center: {
                latitude: 19.448155,
                longitude: -99.134184
            }
        };

        self.mapOptions = {
            disableDefaultUI: true,
            styles:  [{
                    featureType: "poi",
                    elementType: "labels",
                    stylers: [
                        { visibility: "off" }
                    ]
                }]
        };
        self.selectedStation = null;
        self.nearestStation = null;
        self.stationMarkers = stationMarkers;

        self.bottomSheetModal = null;
        self.rateStationModal = null;

        self.newStationRating = {
            rating: 0
        };

        self.improvementAreas = angular.copy(catalogs.improvementAreas);

        self.closeBottomSheet = closeBottomSheet;
        self.closeRateStationModal = closeRateStationModal;
        self.openRateStationModal = openRateStationModal;

        self.calculateRoute = calculateRoute;

        self.displayStationMapActions = false;

        self.submitStationRating = submitStationRating;
        self.whatToImproveIsValid = whatToImproveIsValid;

        init();

        // *********************************
        // Internal
        // *********************************

        function centerMap () {

            if (self.myLocation.latitude && self.myLocation.longitude) {

                self.map = {
                    center: {
                        latitude: self.myLocation.latitude,
                        longitude: self.myLocation.longitude
                    }
                };

                if (Object.keys(stationsInQuery).length > 0) {
                    fitBoundsToNearestStations();
                }
                else
                {
                    self.map.zoom = 16;
                }

                self.myLocationMarker.options.visible = true;
            }

            startWatchLocation();
        }

        function retrieveStations (latitude, longitude, radiusKm) {

            $log.log('retrieve from:' + latitude + ',' + longitude);

            if (!geoQuery) {
                geoQuery = GeofireRef.query({
                    center: [latitude, longitude],
                    radius: radiusInKm
                });

                geoQuery.on("key_entered", onStationEntered);
                geoQuery.on("ready", onGeoQueryReady);
            }
            // Only reload stations if the previous location is 1 km from the current location
            // or if there are no station on the map
            else {
                $log.log('diatancia: ' + GeoFire.distance(geoQuery.center(), [latitude, longitude]));

                if (GeoFire.distance(geoQuery.center(), [latitude, longitude]) > 1) {

                    $log.log('updating geoquery');

                    geoQuery.updateCriteria({
                        center: [latitude, longitude],
                        radius: radiusKm
                    });
                }
            }
        }

        /* Adds new station markers to the map when they enter the query */
        function onStationEntered(id, location) {

            stationsInQuery[id] = { latitude: location[0], longitude: location[1]};

            // Look up the station's data
            Ref.child('stations').child(id).once('value', onStationDataLoaded);
        }

        function onStationDataLoaded (dataSnapshot) {

            var station = dataSnapshot.val();

            // If the station has not already exited this query in the time it took to look up its data in firebase
            // Set, add it to the map
            if (station !== null) {

                var marker = new StationMarker(station, dataSnapshot.key(), stationMarkerClickClosure);

                // Add the station to the list of stations in the query
                stationsInQuery[dataSnapshot.key()] = marker;

                $timeout(function() {
                    stationMarkers.push(marker);
                });

                if(marker.ratingValue >= 4) {
                    $scope.$broadcast('green-station-entered');
                }
            }
        }

        function stationMarkerClickClosure(stationMarker) {
            return function() {
                self.selectedStation = stationMarker;
                self.bottomSheetModal.show();
                self.displayStationMapActions = true;
            };
        }

        function onGeoQueryReady() {

            if (Object.keys(stationsInQuery).length > 0) {

                if (findNearestStationPopup) {
                    findNearestStationPopup.close();
                    findNearestStationPopup = null;
                }

                if (findingNearestStation === false && navigating === false) {

                   fitBoundsToNearestStations();
                }
                else {
                    var nearestStation = _.chain(stationsInQuery)
                        .sortBy(function (station) {
                            return GeoFire.distance([self.myLocation.latitude, self.myLocation.longitude], [station.latitude, station.longitude]);
                        })
                        .first(1).value();
                    self.selectedStation = nearestStation;
                    calculateRoute();

                    findingNearestStation = false;

                    $ionicLoading.hide();
                }
            }
            else {
                if (findingNearestStation === false) {
                    // Display route to the nearest station outside the initial radius
                    nearestStationRouteConfirmation();
                }
                else {
                    findNearestStation();
                }
            }

        }

        function fitBoundsToNearestStations() {
            uiGmapIsReady.promise(1).then( function(instances) {
                var nearestStations = _.chain(stationsInQuery)
                    .sortBy(function (station) {
                        return GeoFire.distance([self.myLocation.latitude, self.myLocation.longitude], [station.latitude, station.longitude]);
                    })
                    .take(3)
                    .map(function (station) {
                        return [station.latitude, station.longitude];
                    })
                    .value();

                var bounds = new google.maps.LatLngBounds();

                bounds.extend(new google.maps.LatLng(self.myLocation.latitude, self.myLocation.longitude));

                angular.forEach(nearestStations, function (item) {
                    bounds.extend(new google.maps.LatLng(item[0], item[1]));
                });

                instances[0].map.fitBounds(bounds);
            });
        }

        function nearestStationRouteConfirmation() {

            if (findNearestStationPopup) {
                findNearestStationPopup.close();
                findNearestStationPopup = null;
            }

            findNearestStationPopup = $ionicPopup.confirm({
                title: 'No hay estaciones cercanas',
                template: '¿Deseas ver la ruta a la estación más próxima?',
                cancelText: 'Cancelar'
            });
            findNearestStationPopup.then(function(res) {
                if(res) {
                    findNearestStation();
                }
            });
        }

        function findNearestStation() {

            if (findingNearestStation === false) {
                $ionicLoading.show({
                    template: '<ion-spinner></ion-spinner><div>Buscando</div>',
                    noBackdrop: false
                });
            }

            findingNearestStation = true;

            var currentRadius = geoQuery.radius();

            geoQuery.updateCriteria({
                center: [self.myLocation.latitude, self.myLocation.longitude],
                radius: currentRadius + 10
            });

        }

        function calculateRoute() {
            uiGmapIsReady.promise(1).then( function(instances) {

                if (!directionsService)
                    directionsService = new google.maps.DirectionsService();

                if(!directionsDisplay)
                    directionsDisplay = new google.maps.DirectionsRenderer();

                var instanceMap = instances[0].map;

                directionsDisplay.setMap(instanceMap);

                var directionsServiceRequest = {
                    origin: self.myLocation.latitude.toString() + ',' + self.myLocation.longitude.toString(),
                    destination: self.selectedStation.latitude.toString() + ',' + self.selectedStation.longitude.toString(),
                    travelMode: google.maps.TravelMode.DRIVING
                };

                directionsService.route(directionsServiceRequest, function(response, status) {

                    if (status == google.maps.DirectionsStatus.OK) {
                        directionsDisplay.setDirections(response);
                        self.bottomSheetModal.hide();
                        $scope.$broadcast('route-displayed');
                    }
                    else {
                        console.log(status);
                        console.log(response);

                        $cordovaToast.showShortCenter('Ocurrió un problema al mostrar la ruta');
                    }


                });
            }, function (error) {
                    $log.log(error);
                    $log.log('Instances: ' + uiGmapIsReady.instances());
                }
            );
        }

        function clearRoute() {
            navigating = false;
            uiGmapIsReady.promise(1).then(function(instances) {

                    if (directionsDisplay) {
                        directionsDisplay.setMap(null);
                    }


                }, function (error) {
                    $log.log(error);
                    $log.log('Instances: ' + uiGmapIsReady.instances());
                }
            );
        }

        function nearestGreenStationRoute() {

            var greenStation = _.chain(stationsInQuery)
                .filter(function (station) {
                    return station.ratingValue >= 4;
                })
                .sortBy(function (station) {
                    return GeoFire.distance([self.myLocation.latitude, self.myLocation.longitude], [station.latitude, station.longitude]);
                })
                .first().value();

            self.selectedStation = greenStation;
            calculateRoute();

            $ionicLoading.hide();
        }

        function closeBottomSheet(){
            self.bottomSheetModal.hide();
        }

        function closeRateStationModal(){
            self.rateStationModal.remove();
        }

        function openRateStationModal(){
            closeBottomSheet();

            $ionicModal.fromTemplateUrl('rate-station.html', {
                scope: $scope,
            }).then(function(modal) {
                self.rateStationModal = modal;

                self.newStationRating = {
                    stationId: self.selectedStation.id,
                    name: self.selectedStation.name,
                    rating: 0,
                    whatToImprove: null,
                    comment: null
                };

                self.rateStationModal.show();
            });

        }

        function submitStationRating(form) {

            if (form.$valid) {

                Auth.$requireAuth().then( function(user) {

                    $ionicLoading.show({
                        template: '<ion-spinner></ion-spinner><div>Enviando...</div>',
                        noBackdrop: false
                    });

                    var newRatingRef = Ref.child('ratings/' + self.newStationRating.stationId)
                        .push({
                            userId: user.uid,
                            rating: self.newStationRating.rating,
                            time: Firebase.ServerValue.TIMESTAMP,
                            whatToImprove: self.newStationRating.rating > 3 ? null : self.newStationRating.whatToImprove,
                            comment: self.newStationRating.comment
                        }, function(error) {

                            $ionicLoading.hide();

                            if (error) {
                                $log.log(error);
                                $cordovaToast.showShortCenter(error);
                            } else {

                                Ref.child('stations/' + self.newStationRating.stationId + '/rating')
                                    .transaction(function(currentRating) {

                                        currentRating = currentRating || {};

                                        currentRating.sum = (currentRating.sum || 0) + self.newStationRating.rating;
                                        currentRating.count = (currentRating.count || 0) + 1;
                                        currentRating.lastRatingId = newRatingRef.key();

                                        return currentRating;
                                    }, function(error, committed, snapshot) {
                                        if (error || !committed) {
                                            $log.log('Transaction failed. Committed: ' + committed + '. ' + error);
                                            $cordovaToast.showShortCenter('Se produjo un error al envíar la evaluación');

                                        }
                                        else {
                                            stationsInQuery[self.newStationRating.stationId].rating = snapshot.val();                                                   
                                            stationsInQuery[self.newStationRating.stationId].refreshMarkerRating();

                                            form.$setPristine();
                                            closeRateStationModal();
                                        }
                                    }
                                );
                            }
                        });
                }, function() {
                    closeRateStationModal();
                    $cordovaToast.showShortCenter('Debes iniciar sesión');
                });
            }
        }

        function whatToImproveIsValid(value) {
            return self.newStationRating.rating > 3 || (angular.isDefined(value) && !!value);
        }

        function fitBoundsToRoute() {
            uiGmapIsReady.promise(1).then( function(instances) {
                var bounds = new google.maps.LatLngBounds();

                bounds.extend(new google.maps.LatLng(self.myLocation.latitude, self.myLocation.longitude));
                bounds.extend(new google.maps.LatLng(self.selectedStation.latitude, self.selectedStation.longitude));

                instances[0].map.fitBounds(bounds);
            });
        }

        function startWatchLocation() {
            $ionicPlatform.ready(function() {
                if (watchLocation !== null) {
                    $cordovaGeolocation.clearWatch(watchLocation.watchID);
                }

                watchLocation = $cordovaGeolocation.watchPosition(geolocationOptions);
                $log.log('before then:'+ angular.toJson(watchLocation));
                watchLocation.then(
                    null,
                    function(error) {

                        if(geolocationSwitchModeAttempted === false) {

                            geolocationOptions = { maximumAge: 2000, timeout: 4000, enableHighAccuracy: false };

                            startWatchLocation();
                            geolocationSwitchModeAttempted = true;
                        }
                        else {

                            $log.log('Cordova Plugins: ' + angular.toJson(cordova.plugins));

                            var popup;

                            if (startingView === true) //&& error.code === error.PERMISSION_DENIED || error.code === error.POSITION_UNAVAILABLE )
                            {
                                if (ionic.Platform.isAndroid() === true) {
                                    popup = $ionicPopup.alert({
                                        title: 'Servicios de ubicación desactivados',
                                        template: 'Habilitar servicios de ubicación.',
                                        cancelText: 'Cancelar',
                                        okText: 'Habilitar'
                                    });
                                    popup.then(function (res) {
                                        $log.log(angular.toJson(res));
                                        if (res) {
                                            cordova.plugins.diagnostic.switchToLocationSettings();
                                        }
                                    });
                                }
                                else {
                                    popup = $ionicPopup.alert({
                                        title: 'Servicios de ubicación desactivados',
                                        template: 'Habilita la localización de tu dispositvo',
                                        okText: 'Aceptar'
                                    });
                                }
                            }
                            else {
                                $cordovaToast.showShortCenter('No pudimos determinar tu ubicación. Valida la configuración de tu dispositivo');
                            }

                            startingView = false;

                        }

                        $log.log('geoerror: ' + angular.toJson(error));
                    },
                    function(position) {

                        $log.log('coords: ' +  angular.toJson(position.coords));

                        // $scope.$timeout is needed to trigger the digest cycle when the geolocation arrives and to update all the watchers
                        $timeout(function() {

                            var coords = [position.coords.latitude, position.coords.longitude];

                            self.myLocation.latitude = coords[0];
                            self.myLocation.longitude = coords[1];

                            $log.log('then startingView: ' +  startingView);
                            if (navigating === true) {
                                fitBoundsToRoute();
                            }
                            else if (startingView === true) {
                                centerMap();
                            }

                            retrieveStations(coords[0], coords[1], radiusInKm);

                            startingView = false;
                        });
                    });
            });
        }

        function init() {
            console.log('Init Map Controller');

            uiGmapGoogleMapApi.then(function(maps) {

            });

            $scope.$on('$ionicView.afterEnter', function(e) {
                $log.log('view after enter');

                uiGmapIsReady.promise(1).then(function(instances) {
                    google.maps.event.trigger(instances[0].map, "resize");
                }, function (error) {
                        console.log(error);
                        console.log('Instances: ' + uiGmapIsReady.instances());
                    }
                );
            });

            $scope.$on('$ionicView.beforeEnter', function(e) {
                $log.log('view before enter');
                startingView = true;

                geolocationOptions = { maximumAge: 2000, timeout: 15000, enableHighAccuracy: true };
                geolocationSwitchModeAttempted = false;
            });

            $scope.$on('$ionicView.beforeLeave', function(e) {
                $log.log('view before leave');
               closeBottomSheet();
            });

            $ionicModal.fromTemplateUrl('map-bottom-sheet.html', {
                scope: $scope,
                viewType: 'bottom-sheet',
                animation: 'slide-in-up'
            }).then(function(modal) {
                self.bottomSheetModal = modal;
            });

            startWatchLocation();

            mapWidgetsChannel.add('centerOnMyLocation', centerMap);
            mapWidgetsChannel.add('calculateRoute', calculateRoute);
            mapWidgetsChannel.add('nearestGreenStationRoute', nearestGreenStationRoute);
            mapWidgetsChannel.add('clearRoute', clearRoute);
        }
    })
    .controller('MapGeneralWidgetsCtrl', function($scope, $timeout, mapWidgetsChannel) {
        var self = this;

        self.centerOnMyLocation = function (){
            mapWidgetsChannel.invoke('centerOnMyLocation');
        };
    })
    .controller('MapStationWidgetsCtrl', function($scope, $log, mapWidgetsChannel) {
        var self = this;

        $log.log('--->>> MapStationWidgetsCtrl');

        self.nearestStation = { id: "" };

        self.showNormalActions = true;
        self.showBottomSheetActions = false;
        self.showNavigationModelActions = false;

        self.showNearestGreenStationAction = false;

        self.nearestGreenStationRoute = function (){
            mapWidgetsChannel.invoke('nearestGreenStationRoute');
            self.showNearestGreenStationAction = true;
        };

        self.clearRoute = function () {
            mapWidgetsChannel.invoke('clearRoute');
            self.showNavigationModelActions = false;
            self.showNormalActions = true;
        };

        $scope.$on('bottom-sheet.shown', function(event) {
            self.showBottomSheetActions = true;
            self.showNormalActions = false;
        });

        $scope.$on('bottom-sheet.hidden', function(event) {
            self.showBottomSheetActions = false;
            self.showNormalActions = true;
        });

        $scope.$on('green-station-entered', function(event) {
            self.showNearestGreenStationAction = true;
        });

        $scope.$on('route-displayed', function(event) {
            self.showNavigationModelActions = true;
            self.showNormalActions = false;
        });
    });


