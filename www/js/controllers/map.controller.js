angular.module('starter.controllers')
    .controller('MapCtrl', function($scope, $timeout, $ionicLoading, $ionicPlatform, $cordovaGeolocation, $cordovaToast) {
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
            $timeout(function() {
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
                template: 'Obteniendo ubicación...',
                noBackdrop: false
            });

            $ionicPlatform.ready(function() {
                $cordovaGeolocation
                    .getCurrentPosition({timeout: 10000, enableHighAccuracy: false})
                    .then(drawMap, function(err) {
                        $ionicLoading.hide()

                        $cordovaToast
                            .showShortCenter(err);
                    });
            });
        }
    });
