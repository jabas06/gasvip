angular.module('starter.services')
    .factory('$cordovaDiagnostic', ['$q', '$window', function ($q, $window) {

        return {
            isLocationEnabled: function() {
                var q = $q.defer();

                $window.cordova.plugins.diagnostic.isLocationEnabled(function(enabled){
                    q.resolve(enabled);
                }, function(err){
                    q.reject(err);
                });

                return q.promise;
            },

            getLocationMode: function() {
                var q = $q.defer();

                $window.cordova.plugins.diagnostic.getLocationMode(function(mode){
                    q.resolve(mode);
                }, function(err){
                    q.reject(err);
                });

                return q.promise;
            },

            switchToAndroidLocationSettings: function() {
                $window.cordova.plugins.diagnostic.switchToLocationSettings();
            },

            switchToIosAppSettings: function() {
                var q = $q.defer();

                $window.cordova.plugins.diagnostic.switchToSettings(function(){
                    q.resolve(mode);
                }, function(err){
                    q.reject(err);
                });

                return q.promise;
            }
        };
    }]);