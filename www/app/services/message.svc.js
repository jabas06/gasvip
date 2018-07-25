(function () {
  'use strict';
  angular.module('gasvip')

    .factory('messageService', function ($ionicPopup, $cordovaToast, $ionicPlatform, $timeout) {
      return {
        showShortCenter: showShortCenter,
        showShortBottom: showShortBottom,
        showLongCenter: showLongCenter
      };

      // ----------
      // Internal
      // ----------

      function showShortCenter(message) {
        $ionicPlatform.ready(function () {
          if ((window.cordova && window.cordova.platformId !== 'browser')) {
            $cordovaToast.showShortCenter(message);
          }
          else {
            showIonicAlert(message);
          }
        });
      }

      function showShortBottom(message) {
        $ionicPlatform.ready(function () {
          if ((window.cordova && window.cordova.platformId !== 'browser')) {
            $cordovaToast.showShortBottom(message);
          }
          else {
            showIonicAlert(message);
          }
        });
      }

      function showLongCenter(message) {
        $ionicPlatform.ready(function () {
          if ((window.cordova && window.cordova.platformId !== 'browser')) {
            $cordovaToast.showLongCenter(message);
          }
          else {
            showIonicAlert(message);
          }
        });
      }

      function showIonicAlert(message) {
        var alert = $ionicPopup.alert({
          template: message
        });

        $timeout(function () {
          alert.close(); //close the alert after 3 seconds;
        }, 3000);
      }
    });
})();
