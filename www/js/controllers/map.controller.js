angular.module('starter.controllers', [])
    .controller('MapCtrl', function($scope, $ionicLoading) {
        var self = this;

        self.myLocation = {
            lng : '43.07493',
            lat: '-89.381388'
        };

        self.map = { center: { latitude: self.myLocation.lng, longitude: self.myLocation.lat }, zoom: 8 };

        init();

        // *********************************
        // Internal
        // *********************************

        function drawMap (position) {

            //$scope.$apply is needed to trigger the digest cycle when the geolocation arrives and to update all the watchers
            $scope.$apply(function() {
                self.myLocation.lng = position.coords.longitude;
                self.myLocation.lat = position.coords.latitude;

                self.map = {
                    center: {
                        latitude: self.myLocation.lat,
                        longitude: self.myLocation.lng
                    },
                    zoom: 14,
                    pan: 1
                };

                self.marker = {
                    id: 0,
                    coords: {
                        latitude: self.myLocation.lat,
                        longitude: self.myLocation.lng
                    }
                };

                self.marker.options = {
                    draggable: false,
                    labelContent: '<div><a>Aqui estas</a></div>',
                    labelClass: 'marker-labels'
                };

                $ionicLoading.hide()
            });
        }

        function init() {

            $ionicLoading.show({
                content: 'Getting current location...',
                showBackdrop: false
            });

            navigator.geolocation.getCurrentPosition(drawMap,
                function(error) {
                    alert('Unable to get location: ' + error.message);
                    $ionicLoading.hide()
                }
            );
        }
    });
