(function() {
  'use strict';
  angular.module('gasvip')

    .factory('geolocationManager', function ($q, $log, $cordovaGeolocation, $ionicPlatform,
                                             $ionicPopup, $cordovaDiagnostic, $cordovaToast) {

      var watchLocation = null;
      var geolocationOptions;

      var startingView = true;

      return {
        startWatchLocation: startWatchLocation,
        clearLocationWatch: clearLocationWatch,
        reset: reset,
        isStartingView: isStartingView,
        setStartingView: setStartingView
      };

      // ----------
      // Internal
      // ----------

      function isStartingView() {
        return startingView;
      }

      function setStartingView(state) {
        startingView = !!state;
      }

      function getGeolocationOptions() {
        var q = $q.defer();

        $ionicPlatform.ready(function () {
          $cordovaDiagnostic.isLocationEnabled().then(function (enabled) {
            if (enabled) {
              if (ionic.Platform.isAndroid()) {
                $cordovaDiagnostic.getLocationMode().then(function (mode) {
                  if (mode === 'high_accuracy' || mode === 'device_only') {
                    geolocationOptions = {maximumAge: 1000, timeout: 15000, enableHighAccuracy: true};
                  }
                  else {
                    geolocationOptions = {maximumAge: 1000, timeout: 4000, enableHighAccuracy: false};
                  }

                  q.resolve(geolocationOptions);
                }, function (err) {
                  q.reject(err);
                });
              }
              else {
                geolocationOptions = {maximumAge: 1000, timeout: 15000, enableHighAccuracy: true};
                q.resolve(geolocationOptions);
              }
            }
            else {
              geolocationOptions = {maximumAge: 2000, timeout: 1000, enableHighAccuracy: false};
              q.resolve(geolocationOptions);
            }
          }, function (err) {
            q.reject(err);
          });
        });

        return q.promise;
      }

      function reset() {
        startingView = true;
      }

      function startWatchLocation(locationChangeClosure) {
        $ionicPlatform.ready(function () {
          if (watchLocation !== null) {
            $cordovaGeolocation.clearWatch(watchLocation.watchID);
          }

          getGeolocationOptions().then(function (options) {
            $log.log('geoOptions: ' + angular.toJson(options));

            watchLocation = $cordovaGeolocation.watchPosition(options);

            watchLocation.then(
              null,
              function (error) {
                if (startingView === true) {
                  $cordovaDiagnostic.isLocationEnabled().then(function (enabled) {
                    if (!enabled) {
                      $ionicPopup.confirm({
                        title: 'Servicios de ubicación desactivados',
                        template: 'Habilitar servicios de ubicación.',
                        cancelText: 'Cancelar',
                        okText: 'Habilitar'
                      }).then(function (res) {
                        if (res) {
                          if (ionic.Platform.isAndroid() === true)
                            $cordovaDiagnostic.switchToAndroidLocationSettings();
                          else
                            $cordovaDiagnostic.switchToAppSettings();
                        }
                      });
                    }
                  });
                }
                else {
                  $cordovaToast.showShortCenter('No pudimos determinar tu ubicación. Valida la configuración de tu dispositivo');
                }

                startingView = false;

                $log.log('geoerror: ' + error.code + ', ' + error.message);

              }, function (position) {
                locationChangeClosure(position);
              }
            );
          }, function (err) {
            $log.log('geoOptionsError: ' + angular.toJson(err));
          });
        });
      }

      function clearLocationWatch() {
        $ionicPlatform.ready(function () {
          if (watchLocation !== null) {
            $cordovaGeolocation.clearWatch(watchLocation.watchID);
          }
        });
      }
    });
})();
