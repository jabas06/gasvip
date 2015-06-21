angular.module('starter.controllers')
    .controller('MapCtrl', function($scope, $timeout, $ionicLoading, $ionicPlatform, $cordovaGeolocation, $cordovaToast, uiGmapGoogleMapApi, Ref, GeofireRef) {
        var self = this;

        // Query radius
        var radiusInKm = 10;
        var geoQuery = null;

        // Keep track of all of the stations currently within the query
        var stationsInQuery = {};
        var stationMarkers = [];

        self.myLocation = {};

        self.map = { zoom: 16 };
        self.mapOptions = {disableDefaultUI: true};
        self.stationMarkers = stationMarkers;
        self.stationInfoWindow = {
            coords: {},
            show: false,
            templateParameter: {},
            templateUrl: 'templates/partials/station-info-window.html',
        };

        // uiGmapGoogleMapApi is a promise.
        // The "then" callback function provides the google.maps object.
        uiGmapGoogleMapApi.then(function(maps) {
            self.stationInfoWindow.options = {
                pixelOffset: new maps.Size(-1, -15, 'px', 'px')
            };
        });

        self.markerWindowCloseClick = markerWindowCloseClick;

        init();

        // *********************************
        // Internal
        // *********************************

        function drawMap (position) {

            // $scope.$timeout is needed to trigger the digest cycle when the geolocation arrives and to update all the watchers
            $timeout(function() {
                self.myLocation.latitude = position.coords.latitude;
                self.myLocation.longitude = position.coords.longitude;

                self.map.center = {
                        latitude: self.myLocation.latitude,
                        longitude: self.myLocation.longitude
                };

                if (!geoQuery) {
                    geoQuery = GeofireRef.query({
                        center: [self.myLocation.latitude, self.myLocation.longitude],
                        radius: radiusInKm
                    });

                    geoQuery.on("key_entered", onStationEntered);
                }

                $ionicLoading.hide()

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
                    station.onClick = function() {
                        self.stationInfoWindow.templateParameter = station;
                        self.stationInfoWindow.coords = { latitude: station.lat, longitude: station.lon }
                        self.stationInfoWindow.show = true;
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
            var mapEl = angular.element(document.querySelector('.angular-google-map'));
            var iScope = mapEl.isolateScope();
            if (iScope && iScope.map) {
                var map = iScope.map;
                google.maps.event.trigger(map, "resize");
            }
        });

        function init() {

            $ionicLoading.show({
                template: '<div>Obteniendo ubicación</div><ion-spinner></ion-spinner>',
                noBackdrop: false
            });

            $ionicPlatform.ready(function() {

                $cordovaGeolocation
                    .getCurrentPosition({maximumAge: 3000, timeout: 10000, enableHighAccuracy: true})
                    .then(drawMap, function(err) {
                        $ionicLoading.hide()

/*                        $cordovaToast
                            .showShortCenter(err);*/
                    });
            });
        }
    });
