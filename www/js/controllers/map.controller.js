angular.module('starter.controllers')
    .controller('MapCtrl', function($scope, $timeout, $ionicLoading, $ionicPlatform, $cordovaGeolocation, $cordovaToast, Ref, GeofireRef) {
        var self = this;

        // Query radius
        var radiusInKm = 10;

        // Keep track of all of the stations currently within the query
        var stationsInQuery = {};
        var stationMarkers = [];

        self.myLocation = { latitude: 20.589811, longitude: -100.411887};

        // Create a new GeoQuery instance
        var geoQuery = GeofireRef.query({
            center: [self.myLocation.latitude, self.myLocation.longitude],
            radius: radiusInKm
        });

        self.map = {center: {latitude: 20.58943571, longitude: -100.4115312 }, zoom: 16 };
        self.mapOptions = {disableDefaultUI: true};
        self.stationMarkers = stationMarkers;

        init();

        // *********************************
        // Internal
        // *********************************

        /* Adds new vehicle markers to the map when they enter the query */
        geoQuery.on("key_entered", function(stationId, stationLocation) {
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
                    station.title = station.name;

                    $timeout(function() {
                        stationMarkers.push(station);
                    });
                }
            });
        });

        function drawMap (position) {

            //$scope.$timeout is needed to trigger the digest cycle when the geolocation arrives and to update all the watchers
            $timeout(function() {
                self.myLocation.latitude = position.coords.latitude;
                self.myLocation.longitude = position.coords.longitude;

                self.map.center = {
                        latitude: self.myLocation.latitude,
                        longitude: self.myLocation.longitude
                };

                $ionicLoading.hide()
            });
        }

        function init() {

            $ionicLoading.show({
                template: '<div>Obteniendo ubicación</div><ion-spinner></ion-spinner>',
                noBackdrop: false
            });

            $ionicPlatform.ready(function() {
                var position = {
                    coords: {
                        latitude: geoQuery.center[0],
                        longitude: geoQuery.center[1]
                        }
                };

                $cordovaGeolocation
                    .getCurrentPosition({timeout: 20000, enableHighAccuracy: true})
                    .then(drawMap, function(err) {
                        $ionicLoading.hide()

                        $cordovaToast
                            .showShortCenter(err);
                    });
            });
        }
    });
