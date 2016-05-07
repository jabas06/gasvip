(function() {
  'use strict';
  angular.module('gasvip')

    .controller('MapNativeCtrl', function ($rootScope, $scope, $timeout, $log, $state, nativeMapService,
                                     $ionicLoading, $ionicPlatform, $ionicModal, $ionicPopup,
                                     geolocationManager, $cordovaToast, StationMarker, $window,
                                     GeofireRef, GeoFire, _, appModals, stationsService,
                                     mapWidgetsChannel, uiGmapIsReady, user, $cordovaSocialSharing, ratingsService) {
      var vm = this;

      // Query radius
      var radiusInKm = 12;
      var geoQuery = null;

      // Keep track of all of the stations currently within the query
      var stationsInQuery = {};
      var stationMarkers = [];

      var findingNearestStation = false;
      var navigating = false;

      var previousNavigatinCoords = null;

      var lastNetworkStatus = '';

      var memberBenefitsPopup = {
        templateUrl: 'app/shared/member-benefits.html',
        title: 'Hazte miembro. Es gratis!',
        subTitle: '',
        scope: $scope,
        buttons: [
          {
            text: '<b>Iniciar sesión</b>',
            type: 'button-balanced',
            onTap: function (e) {
              $state.go('app.login');
            }
          }
        ]
      };

      vm.test = function(){
        fitBoundsToNearestStations();
      };

      vm.mapVisible = true;

      vm.myLocation = {};
/*      vm.myLocationMarker = {
        id: '1',
        icon: {
          path: 0, // 0 is equal to google.maps.SymbolPath.CIRCLE
          scale: 7,
          fillOpacity: 1,
          fillColor: '#387ef5',
          strokeColor: 'white',
          strokeWeight: 2
        },
        options: {
          clickable: false,
          visible: false
        }
      };*/

      vm.map = {
        zoom: 7,
        center: {
          latitude: 19.448155,
          longitude: -99.134184
        }
      };

      vm.mapOptions = {
        disableDefaultUI: true,
        styles: [{
          featureType: "poi",
          elementType: "labels",
          stylers: [
            {visibility: "off"}
          ]
        }],
        minZoom: 7,
        maxZoom: 18
      };
      vm.selectedStation = null;
      vm.stationMarkers = stationMarkers;

      vm.bottomSheetModal = null;

      vm.closeBottomSheet = closeBottomSheet;
      vm.openRateStationModal = openRateStationModal;
      vm.showRatingHistory = showRatingHistory;
      vm.showScoreDetail = showScoreDetail;

      vm.calculateRoute = calculateRoute;
      vm.showProfecoInfo = showProfecoInfo;
      vm.shareStation = shareStation;

      vm.displayStationMapActions = false;

      init();

      // ----------
      // Internal
      // ----------

      function centerMap() {
        if (vm.myLocation.latitude && vm.myLocation.longitude) {
          nativeMapService.setCenter([vm.myLocation.latitude, vm.myLocation.longitude]);

          if (Object.keys(stationsInQuery).length > 0)
            fitBoundsToNearestStations();
          else
            nativeMapService.setZoom(16);

          //vm.myLocationMarker.options.visible = true;
        }

        geolocationManager.startWatchLocation(locationChange);
      }

      function retrieveStations(latitude, longitude, radiusKm) {
        if (!geoQuery) {
            $ionicLoading.show({
              template: '<ion-spinner></ion-spinner> Buscando gasolineras'
            });

            geoQuery = GeofireRef.query({
              center: [latitude, longitude],
              radius: radiusInKm
            });

            geoQuery.on("key_entered", onStationEntered);
            geoQuery.on("ready", onGeoQueryReady);
        }
        // Only reload stations if the previous location is 1 km from the current location
        else {
          if (GeoFire.distance(geoQuery.center(), [latitude, longitude]) > 1) {
            geoQuery.updateCriteria({
              center: [latitude, longitude],
              radius: radiusKm
            });
          }
        }
      }

      /* Adds new station markers to the map when they enter the query */
      function onStationEntered(key, location) {
        stationsInQuery[key] = {latitude: location[0], longitude: location[1]};

        stationsService.getStationData(key).then(function (station) {
          var stationData = new StationMarker(station);

          if (stationData !== null) {
            console.log('add marker' + key);
            nativeMapService.addStationMarker(stationData, stationMarkerClick).then(function (mapMarker) {
              // Add the station to the list of stations in the query
              stationsInQuery[stationData.fbKey] = stationData;

              stationMarkers.push(mapMarker);
            });
          }
        });
      }

      function stationMarkerClick(marker) {
        vm.selectedStation = stationsInQuery[marker.get('fbKey')];
        vm.bottomSheetModal.show();
        vm.displayStationMapActions = true;
        //nativeMapService.setClickable(false);
      }

      function onGeoQueryReady() {
        $ionicLoading.hide();

        if (Object.keys(stationsInQuery).length > 0) {

          if (findingNearestStation === true) {
            vm.selectedStation = _.chain(stationsInQuery)
              .sortBy(function (station) {
                return GeoFire.distance([vm.myLocation.latitude, vm.myLocation.longitude], [station.latitude, station.longitude]);
              })
              .first(1).value();

            calculateRoute();

            findingNearestStation = false;
          }
          else if (navigating === false) {
            fitBoundsToNearestStations();
          }

        }
        else {
          if (findingNearestStation === false) {
            // Display route to the nearest station outside the initial radius
            nearestStationRouteConfirmation();
          }
          else
            findNearestStation();
        }
      }

      function fitBoundsToNearestStations() {
        var nearestStations = _.chain(stationsInQuery)
          .sortBy(function (station) {
            return GeoFire.distance([vm.myLocation.latitude, vm.myLocation.longitude], [station.latitude, station.longitude]);
          })
          .take(3)
          .map(function (station) {
            return [station.latitude, station.longitude];
          })
          .value();

        var points = [
          [vm.myLocation.latitude, vm.myLocation.longitude]
        ];

        angular.forEach(nearestStations, function (item) {
          points.push([item[0], item[1]]);
        });

        nativeMapService.fitBoundsToPoints(points);
      }

      function nearestStationRouteConfirmation() {
        $ionicPopup.confirm({
          title: 'No hay estaciones cercanas',
          template: '¿Deseas ver la ruta a la estación más próxima?',
          cancelText: 'Cancelar'
        }).then(function (res) {
          if (res)
            findNearestStation();
        });
      }

      function findNearestStation() {
        $ionicLoading.show({
          template: '<ion-spinner></ion-spinner><div>Buscando</div>',
          noBackdrop: false
        });

        findingNearestStation = true;

        var currentRadius = geoQuery.radius();

        geoQuery.updateCriteria({
          center: [vm.myLocation.latitude, vm.myLocation.longitude],
          radius: currentRadius + 10
        });
      }

      function calculateRoute() {
        var origin = [vm.myLocation.latitude, vm.myLocation.longitude];
        var destination = [vm.selectedStation.latitude, vm.selectedStation.longitude];

        nativeMapService.calculateRoute(origin, destination).then(function (result) {
          onlyShowSelectedStation();

          navigating = true;
          previousNavigatinCoords = [vm.myLocation.latitude, vm.myLocation.longitude];

          closeBottomSheet();

          $scope.$broadcast('route-displayed');
        }).catch(function (error) {
          if (error.routeDisplayed === false) {
            $cordovaToast.showShortBottom('Ocurrió un problema al mostrar la ruta');
          }
        });
      }

      function showProfecoInfo() {
        if (user) {
          $ionicPopup.show({
            templateUrl: 'app/map/profeco-info.html',
            title: 'Inspección de Profeco',
            subTitle: '',
            scope: $scope,
            buttons: [
              {text: 'Cerrar'}
            ]
          });
        }
        else
          $ionicPopup.show(memberBenefitsPopup);
      }

      function shareStation() {
        var uri = "geo:" + vm.selectedStation.latitude + "," +
          vm.selectedStation.longitude + "?q=" + vm.selectedStation.latitude +
          "," + vm.selectedStation.longitude;

        uri = '"http://maps.google.com/maps?z=12&q=loc:' + vm.selectedStation.latitude + ',' + vm.selectedStation.longitude + '"';

        $ionicLoading.show();
        $cordovaSocialSharing
        //.share('Te recomiendo esta gasolinera! ' + uri + '. Puedes encontrar más opciones en GasVIP. ', null, null, '"gasvip.com.mx"') // Share via native share sheet
          .share('Te recomiendo esta app para que encuentres las mejores gasolineras en tu zona.', null, null, 'gasvip.com.mx') // Share via native share sheet
          .then(function (result) {
            $log.log(angular.toJson('share: ' + result));
          }, function (err) {
            $log.log(angular.toJson(err));
            $cordovaToast.showShortBottom('No se compartió el contenido');
          }).finally(function () {
          $ionicLoading.hide();
        });
      }

      function onlyShowSelectedStation() {
        angular.forEach(stationMarkers, function (marker) {
          marker.options.visible = vm.selectedStation.fbKey === marker.fbKey;
        });
      }

      function showAllStationMarkers() {
        angular.forEach(stationMarkers, function (marker) {
          marker.options.visible = true;
        });
      }

      function clearRoute() {
        nativeMapService.clearRoute().then(function (result) {
          navigating = false;
          showAllStationMarkers();
        });
      }

      function nearestGreenStationRoute() {
        if (user) {
          var greenStation = _.chain(stationsInQuery)
            .filter(function (station) {
              return station.ratingValue >= 4;
            })
            .sortBy(function (station) {
              return GeoFire.distance([vm.myLocation.latitude, vm.myLocation.longitude], [station.latitude, station.longitude]);
            })
            .first().value();

          if (greenStation) {
            vm.selectedStation = greenStation;
            calculateRoute();
          }
          else {
            $ionicPopup.alert({
              title: 'Sin resultados',
              template: 'No hemos encontrado una gasolinera VIP cercana.',
              okText: 'Aceptar'
            });
          }
        }
        else
          $ionicPopup.show(memberBenefitsPopup);
      }

      function closeBottomSheet() {
        vm.bottomSheetModal.hide();
        //nativeMapService.setClickable(true);
      }

      function openRateStationModal() {
        if (user) {
          ratingsService.newRatingForStation(vm.selectedStation, user).then(function (result) {
            if (result.canRateStation) {

              closeBottomSheet();

              appModals.showRateStation({ newRating: result.newRating}).then(function (rating) {
                if (rating) {
                  stationsInQuery[result.newRating.stationId].rating = rating;
                  stationsInQuery[result.newRating.stationId].refreshMarkerRating();
                }
              })
            }
            else {
              $ionicPopup.alert({
                title: '',
                template: result.message,
                okText: 'Aceptar'
              });
            }
          }).catch(function (error) {
            $log.log(angular.toJson(error));
            $cordovaToast.showShortBottom('Ocurrió un error. Intenta nuevamente.');
          });
        }
        else
          $ionicPopup.show(memberBenefitsPopup);
      }

      function showScoreDetail() {
        if (user) {
          $ionicPopup.show({
            templateUrl: 'app/map/score-detail.html',
            title: 'Detalle de la calificación',
            subTitle: '',
            scope: $scope,
            buttons: [
              {text: 'Cerrar'}
            ]
          });
        }
        else
          $ionicPopup.show(memberBenefitsPopup);
      }

      function fitBoundsToRoute() {
        nativeMapService.fitBoundsToPoints([
          [vm.myLocation.latitude, vm.myLocation.longitude],
          [vm.selectedStation.latitude, vm.selectedStation.longitude]
        ]);
      }

      function enableMap() {
        uiGmapIsReady.promise(1).then(function () {
            centerMap();
          }, function () {
            recreateMap();
          }
        ).finally(function () {
          $ionicLoading.hide();
        });
      }

      function disableMap() {
        $ionicLoading.show({
          template: 'Lamentamos el inconveniente. Debes estar conectado a Internet para utilizar el mapa',
          noBackdrop: true
        });

        geolocationManager.clearLocationWatch();
      }

      function recreateMap() {
        vm.mapVisible = false;

        $timeout(function () {
          vm.mapVisible = true;

          uiGmapIsReady.promise(1).then(function () {
              centerMap();
            }, function (error) {
              $cordovaToast.showLongCenter('Ocurrió un error al mostrar el mapa');
            }
          );
        }, 1000);
      }

      function addConnectivityListeners() {
        $ionicPlatform.ready(function () {
          if (ionic.Platform.isWebView()) {
            // Enable the map when the device goes online,
            $rootScope.$on('$cordovaNetwork:online', function (event, networkState) {
              if (lastNetworkStatus !== 'online' && lastNetworkStatus !== '') {
                lastNetworkStatus = 'online';
                enableMap();
              }
            });

            // Disable the map when the device goes offline
            $rootScope.$on('$cordovaNetwork:offline', function (event, networkState) {
              if (lastNetworkStatus !== 'offline') {
                lastNetworkStatus = 'offline';
                disableMap();
              }
            });
          }
        });
      }

      function locationChange(position) {
        // $scope.$timeout is needed to trigger the digest cycle when the geolocation arrives and to update all the watchers
        console.log('location change');
        $timeout(function () {
          var coords = [position.coords.latitude, position.coords.longitude];

          vm.myLocation.latitude = coords[0];
          vm.myLocation.longitude = coords[1];

          if (navigating === true) {
            // Adjust the bounds if the device moved 20 meters
            if (previousNavigatinCoords !== null && GeoFire.distance(previousNavigatinCoords, coords) > 0.02) {

              previousNavigatinCoords = coords;
              fitBoundsToRoute();
            }
          }
          else if (geolocationManager.isStartingView() === true) {
            centerMap();
          }

          retrieveStations(coords[0], coords[1], radiusInKm);

          geolocationManager.setStartingView(false);
        });
      }

      function showRatingHistory() {
        if (!user)
          return $ionicPopup.show(memberBenefitsPopup);

        appModals.showRatingHistory({ station: vm.selectedStation });
      }

      function init() {
        addConnectivityListeners();

        nativeMapService.clear();

/*        nativeMapService.isMapReady().then(function (map) {
          var GOOGLE = new $window.plugin.google.maps.LatLng(37.422858, -122.085065);

          return map.moveCamera({
            'target': GOOGLE
          });
        });*/

        $scope.$on('$ionicView.afterEnter', function (e) {
          //nativeMapService.resizeMap();
        });

        $scope.$on('$ionicView.beforeEnter', function (e) {
          geolocationManager.reset();
        });

        $scope.$on('$ionicView.beforeLeave', function (e) {
          closeBottomSheet();
        });

        $ionicPlatform.on('pause', function (event) {
          geolocationManager.clearLocationWatch();
        });

        $ionicPlatform.on('resume', function (event) {
          geolocationManager.startWatchLocation(locationChange);
        });

        $ionicModal.fromTemplateUrl('app/map/map-bottom-sheet.html', {
          scope: $scope,
          viewType: 'bottom-sheet',
          animation: 'slide-in-up'
        }).then(function (modal) {
          vm.bottomSheetModal = modal;

          $scope.$on('bottom-sheet.shown', function (thisModal) {
            if(vm.bottomSheetModal) {

            }
          });
        });

        geolocationManager.startWatchLocation(locationChange);

        mapWidgetsChannel.add('centerOnMyLocation', centerMap);
        mapWidgetsChannel.add('calculateRoute', calculateRoute);
        mapWidgetsChannel.add('nearestGreenStationRoute', nearestGreenStationRoute);
        mapWidgetsChannel.add('clearRoute', clearRoute);
      }
    })
    .controller('MapGeneralWidgetsCtrl', function ($scope, $timeout, mapWidgetsChannel) {
      var self = this;

      self.centerOnMyLocation = function () {
        mapWidgetsChannel.invoke('centerOnMyLocation');
      };
    })
    .controller('MapStationWidgetsCtrl', function ($scope, $log, mapWidgetsChannel) {
      var self = this;

      self.showNavigationModelActions = false;

      self.nearestGreenStationRoute = function () {
        mapWidgetsChannel.invoke('nearestGreenStationRoute');
      };

      self.clearRoute = function () {
        mapWidgetsChannel.invoke('clearRoute');
        self.showNavigationModelActions = false;
      };

      $scope.$on('route-displayed', function () {
        self.showNavigationModelActions = true;
      });
    });
})();
