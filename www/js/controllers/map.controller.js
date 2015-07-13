angular.module('starter.controllers')
    .controller('MapCtrl', function($scope, $timeout, $ionicLoading, $ionicPlatform, $ionicModal, $ionicBackdrop
                                    , $cordovaGeolocation, $cordovaToast, Ref, GeofireRef
                                    , mapWidgetsChannel, uiGmapIsReady, $log) {
        var self = this;

        var directionsService = null;
        var directionsDisplay = null;

        // Query radius
        var radiusInKm = 10;
        var geoQuery = null;

        // Keep track of all of the stations currently within the query
        var stationsInQuery = {};
        var stationMarkers = [];

        var watchLocation;

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
        self.map = { zoom: 16 };
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
        self.selectedStation = {};
        self.stationMarkers = stationMarkers;
        self.stationInfoWindow = {
            coords: {},
            show: false,
            templateParameter: {},
            templateUrl: 'templates/partials/station-info-window.html',
        };
        self.bottomSheetModal = null;
        self.rateStationModal = null;

        self.markerWindowCloseClick = markerWindowCloseClick;
        self.centerOnMyLocation = centerOnMyLocation;
        self.closeBottomSheet = closeBottomSheet;
        self.closeRateStationModal = closeRateStationModal;
        self.openRateStationModal = openRateStationModal;

        self.displayStationMapActions = false;

        init();

        // *********************************
        // Internal
        // *********************************

        function centerMap (position) {

            // $scope.$timeout is needed to trigger the digest cycle when the geolocation arrives and to update all the watchers
            $timeout(function() {
                self.myLocation.latitude = position.coords.latitude;
                self.myLocation.longitude = position.coords.longitude;

                self.map.center = {
                        latitude: self.myLocation.latitude,
                        longitude: self.myLocation.longitude
                };

                self.myLocationMarker.options.visible = true;

                if (!geoQuery) {
                    geoQuery = GeofireRef.query({
                        center: [self.myLocation.latitude, self.myLocation.longitude],
                        radius: radiusInKm
                    });

                    geoQuery.on("key_entered", onStationEntered);
                }
                else {
                    geoQuery.updateCriteria({
                        center: [self.myLocation.latitude, self.myLocation.longitude],
                        radius: radiusInKm
                    });
                }
            });
        }

        /* Adds new station markers to the map when they enter the query */
        function onStationEntered(stationId, stationLocation)
        {
            // Specify that the station has entered this query
            stationsInQuery[stationId] = true;

            // Look up the station's data
            Ref.child("stations").child(stationId).once("value", function(dataSnapshot) {

                var station = dataSnapshot.val();

                // If the station has not already exited this query in the time it took to look up its data in firebase
                // Set, add it to the map
                if (station !== null && stationsInQuery[dataSnapshot.key()] === true) {
                    // Add the vehicle to the list of vehicles in the query
                    stationsInQuery[dataSnapshot.key()] = station;

                    // Create a new marker for the station
                    station.id = dataSnapshot.key();
                    station.latitude = station.lat;
                    station.longitude = station.lon;
                    station.icon = 'img/gas.png'
                    station.name = station.name;
                    station.rating = 4.5;
                   /* station.onClick = function() {
                        self.stationInfoWindow.templateParameter = station;
                        self.stationInfoWindow.coords = { latitude: station.lat, longitude: station.lon }
                        self.stationInfoWindow.show = true;
                    };*/
                    station.onClick = function(){
                        /*station.icon = {
                            path: 0, // 0 is equal to google.maps.SymbolPath.CIRCLE
                            scale: 10,
                            fillOpacity: 1,
                            fillColor: '#387ef5', //'#11c1f3',
                            strokeColor: 'white',
                            strokeWeight: 2
                        };*/
                        self.selectedStation = station;
                        self.bottomSheetModal.show();
                        self.displayStationMapActions = true
                    };

                    $timeout(function() {
                        stationMarkers.push(station);
                    });
                }
            });
        }

        function markerWindowCloseClick()
        {
            self.stationInfoWindow.show = false;
        }

        function centerOnMyLocation()
        {
            $ionicLoading.show({
                template: '<ion-spinner></ion-spinner><div>Obteniendo ubicación</div>',
                noBackdrop: false
            });

            $ionicPlatform.ready(function() {

                $cordovaGeolocation
                    .getCurrentPosition({maximumAge: 3000, timeout: 10000, enableHighAccuracy: true})
                    .then(centerMap, function(error) {
                        $cordovaToast.showShortCenter(error);
                        //alert(error);
                    })
                    .finally($ionicLoading.hide());
            });
        }

        function calculateRoute() {
            uiGmapIsReady.promise(1).then( function(instances) {
                console.log('uiGmapIsReady');
                if (!directionsService)
                    directionsService = new google.maps.DirectionsService();

                if(!directionsDisplay)
                    directionsDisplay = new google.maps.DirectionsRenderer();

                var instanceMap = instances[0].map;

                directionsDisplay.setMap(instanceMap);

                var directionsServiceRequest = {
                    origin: self.myLocation.latitude.toString() + "," + self.myLocation.longitude.toString(),
                    destination: self.selectedStation.latitude.toString() + "," + self.selectedStation.longitude.toString(),
                    travelMode: google.maps.TravelMode.DRIVING
                };

                directionsService.route(directionsServiceRequest, function(response, status) {
                    if (status == google.maps.DirectionsStatus.OK) {
                        directionsDisplay.setDirections(response);
                        self.bottomSheetModal.hide();
                    }
                });
            });
        }

        function closeBottomSheet(){
            self.bottomSheetModal.hide();
        }

        function closeRateStationModal(){
            self.rateStationModal.hide();
        }

        function openRateStationModal(){
            closeBottomSheet();
            self.rateStationModal.show();
        }

        function init() {

            $scope.$on('$ionicView.afterEnter', function(e) {
                uiGmapIsReady.promise(1).then(function(instances) {
                    google.maps.event.trigger(instances[0].map, "resize");
                });
            });

            $scope.$on('$ionicView.beforeLeave', function(e) {
               closeBottomSheet();
            });

            uiGmapIsReady.promise(1).then(function() {
                self.stationInfoWindow.options = {
                    pixelOffset: new google.maps.Size(-1, -15, 'px', 'px')
                };
            });

            $ionicModal.fromTemplateUrl('templates/map-bottom-sheet.html', {
                scope: $scope,
                viewType: 'bottom-sheet',
                animation: 'slide-in-up'
            }).then(function(modal) {
                self.bottomSheetModal = modal;
            });

            $ionicModal.fromTemplateUrl('templates/rate-station.html', {
                scope: $scope,
            }).then(function(modal) {
                self.rateStationModal = modal;
            });

            $ionicPlatform.ready(function() {
               /* watchLocation = $cordovaGeolocation.watchPosition({maximumAge: 2000, timeout: 4000, enableHighAccuracy: true});
                watchLocation.then(
                    null,
                    function(error) {
                        $cordovaToast.showShortCenter(error);
                        //alert(error);
                    },
                    function(position) {
                        // $scope.$timeout is needed to trigger the digest cycle when the geolocation arrives and to update all the watchers
                        $timeout(function() {
                            self.myLocation.latitude = position.coords.latitude;
                            self.myLocation.longitude = position.coords.longitude;

                            self.myLocationMarker.options.visible = true;
                        });
                    });*/
            });

            mapWidgetsChannel.add('centerOnMyLocation', centerOnMyLocation);
            mapWidgetsChannel.add('calculateRoute', calculateRoute);

            centerOnMyLocation();
        }
    })
    .controller('MapGeneralWidgetsCtrl', function($scope, $timeout, mapWidgetsChannel) {
        var self = this;

        self.centerOnMyLocation = function (){
            mapWidgetsChannel.invoke('centerOnMyLocation');
        };
    })
    .controller('MapStationWidgetsCtrl', function($scope, mapWidgetsChannel, uiGmapIsReady) {
        var self = this;

        self.displayStationMapActions = false;

        self.calculateRoute = function (){
            mapWidgetsChannel.invoke('calculateRoute');
        };

        $scope.$on('bottom-sheet.shown', function(event) {
            self.displayStationMapActions = true;
            uiGmapIsReady.promise(1).then(function(instances) {
                google.maps.event.trigger(instances[0].map, "resize");
            });
        });

        $scope.$on('bottom-sheet.hidden', function(event) {
            self.displayStationMapActions = false;
        });
    });

