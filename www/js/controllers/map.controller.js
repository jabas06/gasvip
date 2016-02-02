angular.module('starter.controllers')
    .controller('MapCtrl', function($rootScope, $scope, $timeout, $log, $window, $state,
                                    $ionicLoading, $ionicPlatform, $ionicModal, $ionicBackdrop, $ionicPopup,
                                    geolocationManager, $cordovaToast, StationMarker, uiGmapGoogleMapApi,
                                    Ref, GeofireRef, geoUtils, GeoFire, _, catalogs, appConfig,
                                    mapWidgetsChannel, uiGmapIsReady, Auth, user, $cordovaSocialSharing) {
        var self = this;

        var directionsService = null;
        var directionsDisplay = null;

        // Query radius
        var radiusInKm = 12;
        var geoQuery = null;

        // Keep track of all of the stations currently within the query
        var stationsInQuery = {};
        var stationMarkers = [];

        var findingNearestStation = false;
        var navigating = false;

        var previousNavigatinCoords = null;

        var findNearestStationPopup = null;

        var lastNetworkStatus = '';

        var memberBenefitsPopup = {
            templateUrl: 'templates/member-benefits.html',
            title: 'Hazte miembro. Es gratis!',
            subTitle: '',
            scope: $scope,
            buttons: [
                {
                    text: '<b>Iniciar sesión</b>',
                    type: 'button-balanced',
                    onTap: function(e) {
                        $state.go('app.login');
                    }
                }
            ]
        };

        self.mapVisible = true;

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
                }],
            minZoom: 7,
            maxZoom: 18
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
        self.showProfecoInfo = showProfecoInfo;
        self.shareStation = shareStation;

        self.displayStationMapActions = false;

        self.submitStationRating = submitStationRating;
        self.whatToImproveIsValid = whatToImproveIsValid;


        init();

        // *********************************
        // Internal
        // *********************************

        function centerMap () {

            if (self.myLocation.latitude && self.myLocation.longitude) {

                self.map.center = {
                    latitude: self.myLocation.latitude,
                    longitude: self.myLocation.longitude
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

            geolocationManager.startWatchLocation(locationChange);
        }

        function retrieveStations (latitude, longitude, radiusKm) {

            if (!geoQuery) {

                $ionicLoading.show({
                    template: '<ion-spinner></ion-spinner> Buscando gasolineras'
                });

                geoQuery = GeofireRef.query({
                    center: [latitude, longitude],
                    radius: radiusInKm
                });

                geoQuery.on("key_entered", onStationEntered);
                geoQuery.on("ready", onGeoQueryReady);
            }
            // Only reload stations if the previous location is 1 km from the current location
            else {

                if (GeoFire.distance(geoQuery.center(), [latitude, longitude]) > 1) {

                    geoQuery.updateCriteria({
                        center: [latitude, longitude],
                        radius: radiusKm
                    });
                }
            }
        }

        /* Adds new station markers to the map when they enter the query */
        function onStationEntered(key, location) {

            stationsInQuery[key] = { latitude: location[0], longitude: location[1]};

            // Look up the station's data
            if (user)
                Ref.child('stations').child(key).once('value', onStationDataLoaded, function(err) {
                    console.log(err);
                });
            else
                Ref.child('stations').child(key).child('public').once('value', onStationDataLoaded);
        }

        function onStationDataLoaded (dataSnapshot) {

            var marker = new StationMarker(dataSnapshot, stationMarkerClickClosure, user ? true : false);

            if (marker !== null) {

                // Add the station to the list of stations in the query
                stationsInQuery[marker.id] = marker;

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
            $ionicLoading.hide();

            if (Object.keys(stationsInQuery).length > 0) {

                if (findNearestStationPopup) {
                    findNearestStationPopup.close();
                    findNearestStationPopup = null;
                }

                if (findingNearestStation === true) {
                    var nearestStation = _.chain(stationsInQuery)
                        .sortBy(function (station) {
                            return GeoFire.distance([self.myLocation.latitude, self.myLocation.longitude], [station.latitude, station.longitude]);
                        })
                        .first(1).value();
                    self.selectedStation = nearestStation;
                    calculateRoute();

                    findingNearestStation = false;
                }
                else if (navigating === false) {
                    fitBoundsToNearestStations();
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

            $ionicLoading.show({
                template: '<ion-spinner></ion-spinner><div>Buscando</div>',
                noBackdrop: false
            });

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
                    directionsDisplay = new google.maps.DirectionsRenderer({ suppressMarkers: true });

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

                        onlyShowSelectedStation();

                        navigating = true;
                        previousNavigatinCoords = [self.myLocation.latitude, self.myLocation.longitude];

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

        function showProfecoInfo() {

            if (user) {

                $ionicPopup.show({
                    templateUrl: 'templates/profeco-info.html',
                    title: 'Inspección de Profeco',
                    subTitle: '',
                    scope: $scope,
                    buttons: [
                        {text: 'Cerrar'}
                    ]
                });
            }
            else {

                $ionicPopup.show(memberBenefitsPopup);
            }
        }

        function shareStation() {

            var uri = "geo:" + self.selectedStation.latitude + "," +
                self.selectedStation.longitude + "?q=" + self.selectedStation.latitude +
                "," + self.selectedStation.longitude;

            uri = '"http://maps.google.com/maps?z=12&q=loc:'+ self.selectedStation.latitude + ',' + self.selectedStation.longitude + '"';

            $ionicLoading.show();
            $cordovaSocialSharing
                //.share('Te recomiendo esta gasolinera! ' + uri + '. Puedes encontrar más opciones en GasVIP. ', null, null, '"gasvip.com.mx"') // Share via native share sheet
                .share('Te recomiendo esta app para que encuentres las mejores gasolineras en tu zona.', null, null, 'gasvip.com.mx') // Share via native share sheet
                .then(function(result) {
                    $log.log(angular.toJson('share: ' + result));
                }, function(err) {
                    $log.log(angular.toJson(err));
                    $cordovaToast.showShortCenter('No se compartió el contenido');
                }).finally(function() {
                    $ionicLoading.hide();
                });
        }

        function onlyShowSelectedStation() {
            angular.forEach(stationMarkers, function (marker) {
                marker.options.visible = self.selectedStation.id === marker.id;
            });
        }

        function showAllStationMarkers() {
            angular.forEach(stationMarkers, function (marker) {
                    marker.options.visible = true;
            });
        }


        function clearRoute() {
            uiGmapIsReady.promise(1).then(function(instances) {

                    if (directionsDisplay) {
                        directionsDisplay.setMap(null);
                    }

                    navigating = false;
                    showAllStationMarkers();

                }, function (error) {
                    $log.log(error);
                    $log.log('Instances: ' + uiGmapIsReady.instances());
                }
            );
        }

        function nearestGreenStationRoute() {
            if (user) {
            //Auth.$requireAuth().then( function(user) {
                var greenStation = _.chain(stationsInQuery)
                    .filter(function (station) {
                        return station.ratingValue >= 4;
                    })
                    .sortBy(function (station) {
                        return GeoFire.distance([self.myLocation.latitude, self.myLocation.longitude], [station.latitude, station.longitude]);
                    })
                    .first().value();

                if (greenStation) {
                    self.selectedStation = greenStation;
                    calculateRoute();
                }
                else {
                    $ionicPopup.alert({
                        title: 'Sin resultados',
                        template: 'No hemos encontrado una gasolinera VIP cercana.',
                        okText: 'Aceptar'
                    });
                }
            }//, function() {
            else {
                $ionicPopup.show(memberBenefitsPopup);
            }
            // );
        }

        function closeBottomSheet(){
            self.bottomSheetModal.hide();
        }

        function closeRateStationModal(){
            self.rateStationModal.hide();
        }

        function openRateStationModal(){

            if (user) {
            //Auth.$requireAuth().then( function(user) {

                Ref.child(getTodayRatingPath(user.uid)).once('value', function (data) {

                    var currentRatings = data.val();

                    var ratingNumber = 1;
                    var ratingUid = Ref.child("ratings").push().key();
                    var alreadyRatedStation = false;

                    if (currentRatings !== null) {
                        Object.keys(currentRatings).forEach(function (key) {
                            var currentKey = parseInt(key);

                            if (!isNaN(currentKey)) {
                                ratingNumber = currentKey + 1;

                                if (currentRatings[currentKey].stationId === self.selectedStation.id)
                                    alreadyRatedStation = true;
                            }
                        });
                    }

                    if (ratingNumber > appConfig.MAX_RATINGS_BY_USER) {
                        $ionicPopup.alert({
                            title: '',
                            template: 'Ya has calificado ' + appConfig.MAX_RATINGS_BY_USER + ' gasolineras el día de hoy. Intenta mañana :)',
                            okText: 'Aceptar'
                        });
                    }
                    else if (alreadyRatedStation === true) {
                        $ionicPopup.alert({
                            title: '',
                            template: 'Ya has calificado a esta gasolinera el día de hoy. Intenta mañana :)',
                            okText: 'Aceptar'
                        });
                    }
                    else {
                        closeBottomSheet();

                        self.newStationRating = {
                            uid: ratingUid,
                            ratingNumber: ratingNumber,
                            stationId: self.selectedStation.id,
                            name: self.selectedStation.name,
                            rating: 0,
                            whatToImprove: null,
                            comment: null
                        };

                        if (self.rateStationModal) {
                            self.rateForm.$setPristine();
                            self.rateStationModal.show();
                        }
                        else {
                            $ionicModal.fromTemplateUrl('templates/rate-station.html', {
                                scope: $scope
                            }).then(function (modal) {
                                self.rateStationModal = modal;
                                self.rateStationModal.show();
                            });
                        }
                    }
                }, function (error) {
                    $log.log(angular.toJson(error));

                    $cordovaToast.showShortCenter('Ocurrió un error. Intenta nuevamente.');
                });
            }
            else {//, function() {
                $ionicPopup.show(memberBenefitsPopup);
            }//);
        }

        function getTodayRatingPath(useruid) {
            var ratingDateKey = new Date();
            ratingDateKey.setUTCHours(0,0,0,0);

            return 'ratingsByTime/' + ratingDateKey.getTime() + '/' + useruid;
        }

        function submitStationRating(form) {

            if (form.$valid) {

                if (user) {
                //Auth.$requireAuth().then( function(user) {

                    $ionicLoading.show({
                        template: '<ion-spinner></ion-spinner><div>Enviando...</div>',
                        noBackdrop: false
                    });

                    var newRatingRef = Ref.child(getTodayRatingPath(user.uid) + '/' + self.newStationRating.ratingNumber)
                        .set({
                            uid: self.newStationRating.uid,
                            stationId: self.newStationRating.stationId,
                            rating: self.newStationRating.rating,
                            time: Firebase.ServerValue.TIMESTAMP,
                            whatToImprove: self.newStationRating.rating > 3 ? null : self.newStationRating.whatToImprove,
                            comment: self.newStationRating.comment
                        }, function(error) {

                            if (error) {
                                $log.log(error);

                                $ionicLoading.hide();
                                $cordovaToast.showShortCenter('Ocurrió un error al enviar la calificación. Intenta nuevamente');
                            }
                            else {

                                Ref.child('stations/' + self.newStationRating.stationId + '/private' + '/rating')
                                    .transaction(function(currentRating) {

                                        currentRating = currentRating || {};

                                        currentRating.sum = (currentRating.sum || 0) + self.newStationRating.rating;
                                        currentRating.count = (currentRating.count || 0) + 1;
                                        currentRating.ratingNumber = self.newStationRating.ratingNumber;
                                        return currentRating;
                                    }, function(error, committed, snapshot) {
                                        form.$setPristine();
                                        closeRateStationModal();

                                        $ionicLoading.hide();

                                        if (error || !committed) {
                                            $log.log('Transaction failed. Committed: ' + committed + '. ' + error);

                                            $cordovaToast.showShortCenter('Lu calificación ha sido guardada y será procesada más tarde');
                                        }
                                        else {

                                            stationsInQuery[self.newStationRating.stationId].rating = snapshot.val();
                                            stationsInQuery[self.newStationRating.stationId].refreshMarkerRating();

                                            $cordovaToast.showShortCenter('La calificacíón se guardó correctamente.');
                                        }
                                    }
                                );
                            }
                        });
                }//, function() {
                else {
                    closeRateStationModal();
                    $cordovaToast.showShortCenter('Debes iniciar sesión');
                }//);
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

        function enableMap(){

            uiGmapIsReady.promise(1).then(function(instances) {
                    centerMap();
                }, function (error) {
                    $log.log(angular.toJson(error));

                    recreateMap();
                }
            ).finally(function() {
                    $ionicLoading.hide();
                });
        }

        function disableMap(){
            $ionicLoading.show({
                template: 'Lamentamos el inconveniente. Debes estar conectado a Internet para utilizar el mapa',
                noBackdrop: true
            });

            geolocationManager.clearLocationWatch();
        }

        function recreateMap(){
            self.mapVisible = false;

            $timeout(function(){
                self.mapVisible = true;

                uiGmapIsReady.promise(1).then(function(instances) {
                        centerMap();
                    }, function (error) {
                        $log.log(angular.toJson(error));
                        $cordovaToast.showLongCenter('Ocurrió un error al mostrar el mapa');
                    }
                );
            }, 1000);
        }

        function addConnectivityListeners(){

            $ionicPlatform.ready(function() {
                if(ionic.Platform.isWebView()){

                    // Check if the map is already loaded when the user comes online,
                    //if not, load it
                    $rootScope.$on('$cordovaNetwork:online', function(event, networkState){

                        if (lastNetworkStatus !== 'online' && lastNetworkStatus !== '') {
                            lastNetworkStatus = 'online';
                            enableMap();
                        }
                    });

                    // Disable the map when the user goes offline
                    $rootScope.$on('$cordovaNetwork:offline', function(event, networkState){
                        if (lastNetworkStatus !== 'offline') {
                            lastNetworkStatus = 'offline';
                            disableMap();
                        }
                    });

                }
            });
        }

        function locationChange (position) {

            // $scope.$timeout is needed to trigger the digest cycle when the geolocation arrives and to update all the watchers
            $timeout(function() {

                var coords = [position.coords.latitude, position.coords.longitude];

                self.myLocation.latitude = coords[0];
                self.myLocation.longitude = coords[1];

                if (navigating === true) {
                    // Adjust the bounds if the device moved 20 meters
                    if (previousNavigatinCoords !== null && GeoFire.distance(previousNavigatinCoords, coords) > 0.02) {

                        previousNavigatinCoords = coords;
                        fitBoundsToRoute();
                    }
                }
                else if (geolocationManager.isStartingView() === true) {
                    centerMap();
                }

                retrieveStations(coords[0], coords[1], radiusInKm);

                geolocationManager.setStartingView(false);
            });
        }

        function init() {

            addConnectivityListeners();

            $scope.$on('$ionicView.afterEnter', function(e) {
                $log.log('view after enter');

                uiGmapIsReady.promise(1).then(function(instances) {
                    google.maps.event.trigger(instances[0].map, "resize");
                }, function (error) {
                        $log.log('Error ready: ' + angular.toJson(error));
                        console.log('Instances: ' + uiGmapIsReady.instances());
                    }
                );
            });

            $scope.$on('$ionicView.beforeEnter', function(e) {
                geolocationManager.reset();
            });

            $scope.$on('$ionicView.beforeLeave', function(e) {
               closeBottomSheet();
            });

            $ionicPlatform.on('pause', function(event) {
                geolocationManager.clearLocationWatch();
            });

            $ionicPlatform.on('resume', function(event) {
                geolocationManager.startWatchLocation(locationChange);
            });

            $ionicModal.fromTemplateUrl('templates/map-bottom-sheet.html', {
                scope: $scope,
                viewType: 'bottom-sheet',
                animation: 'slide-in-up'
            }).then(function(modal) {
                self.bottomSheetModal = modal;
            });

            geolocationManager.startWatchLocation(locationChange);

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

        self.nearestStation = { id: "" };

        self.showNormalActions = true;
        self.showBottomSheetActions = false;
        self.showNavigationModelActions = false;

        //self.showNearestGreenStationAction = false;

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
            //self.showNearestGreenStationAction = true;
        });

        $scope.$on('route-displayed', function(event) {
            self.showNavigationModelActions = true;
            self.showNormalActions = false;
        });
    });


