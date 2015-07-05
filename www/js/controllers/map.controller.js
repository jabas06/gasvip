angular.module('starter.controllers')
    .controller('MapCtrl', function($scope, $timeout, $ionicLoading, $ionicPlatform, $ionicModal
                                    , $cordovaGeolocation, $cordovaToast, uiGmapGoogleMapApi
                                    , Ref, GeofireRef, mapWidgetsChannel, uiGmapIsReady) {
        var self = this;

        // Default rating
        self.rating = 4;
        self.max_rating = 5;

        // Query radius
        var radiusInKm = 10;
        var geoQuery = null;

        // Keep track of all of the stations currently within the query
        var stationsInQuery = {};
        var stationMarkers = [];

        self.myLocation = {};
        self.myLocationMarker = {
            id: '1',
            icon: {
                scale: 10,
                fillOpacity: 1,
                fillColor: '#387ef5', //'#11c1f3',
                strokeColor: 'white',
                strokeWeight: 2
            },
            /*icon: {
                url: 'img/blue-pin.png'
            },*/
            options: {
                clickable: false,
                visible: false
            }
        };
        self.map = { zoom: 16 };
        self.mapOptions = {disableDefaultUI: true};
        self.selectedStation = {};
        self.stationMarkers = stationMarkers;
        self.stationInfoWindow = {
            coords: {},
            show: false,
            templateParameter: {},
            templateUrl: 'templates/partials/station-info-window.html',
        };

        uiGmapGoogleMapApi.then(function(maps) {
            self.myLocationMarker.icon.path = maps.SymbolPath.CIRCLE;

            self.stationInfoWindow.options = {
                pixelOffset: new maps.Size(-1, -15, 'px', 'px')
            };
        });

        self.markerWindowCloseClick = markerWindowCloseClick;
        self.centerOnMyLocation = centerOnMyLocation;
        self.closeBottomSheet = closeBottomSheet;

        var directionsService;
        var directionsDisplay;

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

        /* Adds new vehicle markers to the map when they enter the query */
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
                   /* station.onClick = function() {
                        self.stationInfoWindow.templateParameter = station;
                        self.stationInfoWindow.coords = { latitude: station.lat, longitude: station.lon }
                        self.stationInfoWindow.show = true;
                    };*/
                    station.onClick = function(){
                        self.selectedStation = station;
                        self.rateStationModal.show();
                    };

                    $timeout(function() {
                        stationMarkers.push(station);
                    });
                }
            });
        }

        function markerClick()
        {

        }

        function markerWindowCloseClick()
        {
            self.stationInfoWindow.show = false;
        }

        $scope.$on('$ionicView.afterEnter', function(e) {
            uiGmapIsReady.promise(1).then(function(instances) {
                google.maps.event.trigger(instances[0].map, "resize");
            });
        });

        function centerOnMyLocation()
        {
            $ionicLoading.show({
                template: '<div>Obteniendo ubicación</div><ion-spinner></ion-spinner>',
                noBackdrop: false
            });

            $ionicPlatform.ready(function() {

                $cordovaGeolocation
                    .getCurrentPosition({maximumAge: 3000, timeout: 10000, enableHighAccuracy: true})
                    .then(centerMap, function(error) {
                        $cordovaToast.showShortCenter(error);
                    })
                    .finally($ionicLoading.hide());
            });
        }

        function calculateRoute() {
            uiGmapGoogleMapApi.then( function(maps) {

                directionsService = new maps.DirectionsService();
                directionsDisplay = new maps.DirectionsRenderer();

                return uiGmapIsReady.promise(1);
            }).then( function(instances) {

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
                    }
                });
            });
        }

        function closeBottomSheet(){
            self.rateStationModal.hide()
        }

        function init() {

            // Create the rate modal that we will use later
            $ionicModal.fromTemplateUrl('templates/rate-station.html', {
                scope: $scope
            }).then(function(modal) {
                self.rateStationModal = modal;
            });

            mapWidgetsChannel.add('centerOnMyLocation', centerOnMyLocation);
            mapWidgetsChannel.add('calculateRoute', calculateRoute);

            centerOnMyLocation();
        }
    })
    .controller('MapWidgetsCtrl', function(mapWidgetsChannel){
        var self = this;

        self.centerOnMyLocation = function (){
            mapWidgetsChannel.invoke('centerOnMyLocation');
        };

        self.calculateRoute = function (){
            mapWidgetsChannel.invoke('calculateRoute');
        };
    });
