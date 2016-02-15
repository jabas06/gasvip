angular.module('starter.services')
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

            if(ionic.Platform.isWebView()){
                return $cordovaNetwork.isOnline();
            } else {
                return navigator.onLine;
            }

        }

        function isOffline(){

            if(ionic.Platform.isWebView()){
                return !$cordovaNetwork.isOnline();
            } else {
                return !navigator.onLine;
            }

        }

    });