(function() {
  'use strict';
  angular.module('gasvip')

    .factory('$cordovaDiagnostic', function ($q, $window) {
      return {
        isLocationEnabled: function () {
          var q = $q.defer();

          $window.cordova.plugins.diagnostic.isLocationEnabled(function (enabled) {
            q.resolve(enabled);
          }, function (err) {
            q.reject(err);
          });

          return q.promise;
        },

        getLocationMode: function () {
          var q = $q.defer();

          $window.cordova.plugins.diagnostic.getLocationMode(function (mode) {
            q.resolve(mode);
          }, function (err) {
            q.reject(err);
          });

          return q.promise;
        },

        switchToAndroidLocationSettings: function () {
          $window.cordova.plugins.diagnostic.switchToLocationSettings();
        },

        switchToAppSettings: function () {
          var q = $q.defer();

          $window.cordova.plugins.diagnostic.switchToSettings(function () {
            q.resolve();
          }, function (err) {
            q.reject(err);
          });

          return q.promise;
        }
      };
    });
})();
