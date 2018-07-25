angular.module('gasvip')
    .factory('ConnectivityMonitor', function($cordovaNetwork){


        var service = {
            isOnline: isOnline,
            isOffline : isOffline
        };

        return service;

        // ----------
        // Internal
        // ----------
        function isOnline(){

            if((window.cordova && window.cordova.platformId !== 'browser')){
                return $cordovaNetwork.isOnline();
            } else {
                return navigator.onLine;
            }

        }

        function isOffline(){

            if((window.cordova && window.cordova.platformId !== 'browser')){
                return !$cordovaNetwork.isOnline();
            } else {
                return !navigator.onLine;
            }

        }

    });
