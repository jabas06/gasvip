(function() {
  'use strict';
  angular.module('gasvip')

    .factory('nativeMapService', function ($window, $q, $timeout, $ionicPlatform, $log) {
      var directionsService = null;
      var directionsDisplay = null;

      var mapInstance = null;
      var readyPromise = null;

      return {
        setCenter: setCenter,
        setZoom: setZoom,
        isMapReady: isMapReady,
        clear: clear,
        setClickable: setClickable,
        addStationMarker: addStationMarker,
        fitBoundsToPoints: fitBoundsToPoints,
        calculateRoute: calculateRoute,
        clearRoute: clearRoute,
        resizeMap: resizeMap
      };

      function setClickable(clickable) {
        return isMapReady().then(function (map) {
          map.setClickable(clickable);
        });
      }

      function addStationMarker(stationData, markerClick) {
        var q = $q.defer();

        var markerDefinition = angular.copy(stationData);
        markerDefinition.position =  new $window.plugin.google.maps.LatLng(stationData.latitude, stationData.longitude);
        markerDefinition.markerClick = markerClick;
        markerDefinition.disableAutoPan = true;

        isMapReady().then(function (map) {
          map.addMarker(markerDefinition, function(markerInstance) {
            q.resolve(markerInstance);
          });
        });

        return q.promise;
      }

      function isMapReady() {
        if (readyPromise)
          return readyPromise

        var q = $q.defer();

        $ionicPlatform.ready(function() {

          var mapDiv = document.getElementById("mapNative");
          var map = $window.plugin.google.maps.Map.getMap(mapDiv, {
            controls: {
              compass: false,
              myLocationButton: true
            },
            gestures: {
              scroll: true,
              tilt: false,
              rotate: false,
              zoom: true
            }
          });

          map.on($window.plugin.google.maps.event.MAP_READY, function () {
             if(!mapInstance)
               mapInstance = map;

            console.log('get mapNative');
             q.resolve(mapInstance);
          });

          $timeout(function () {
            if(!mapInstance)
              q.reject('Map was not initialized');
          }, 4000);
        });

        readyPromise = q.promise;

        return q.promise;
      }

      function setZoom(zoom) {
       return isMapReady().then(function (map) {
          map.setZoom(zoom);
        });
      }

      function clear() {
        if(mapInstance)
          mapInstance.clear();
      }

      // ----------
      // Internal
      // ----------

      function setCenter(location)
      {
        return isMapReady().then(function (map) {
          console.log('set center native');
          //return map.setCenter(new $window.plugin.google.maps.LatLng(location[0], location[1]));
        });
      }

      function fitBoundsToPoints(points) {
        return isMapReady().then(function (map) {
          var latLngPoints = [];

          angular.forEach(points, function(point) {
            latLngPoints.push(new $window.plugin.google.maps.LatLng(point[0], point[1]));
          });

          map.moveCamera({
            target: latLngPoints
          }, function() {
            map.getCameraPosition(function(camera) {
              map.setZoom(camera.zoom - .5);
            });
          });
        });
      }

      function calculateRoute(origin, destination) {
        var deferred = $q.defer();

        uiGmapIsReady.promise(1).then( function(instances) {

          if (!directionsService)
            directionsService = new google.maps.DirectionsService();

          if(!directionsDisplay)
            directionsDisplay = new google.maps.DirectionsRenderer({ suppressMarkers: true });

          var instanceMap = instances[0].map;

          directionsDisplay.setMap(instanceMap);

          var directionsServiceRequest = {
            origin: new google.maps.LatLng(origin[0], origin[1]),
            destination: new google.maps.LatLng(destination[0], destination[1]),
            travelMode: google.maps.TravelMode.DRIVING
          };

          directionsService.route(directionsServiceRequest, function(response, status) {

            if (status == google.maps.DirectionsStatus.OK) {
              directionsDisplay.setDirections(response);

              deferred.resolve( {response: response, status: status, routeDisplayed: true  });
            }
            else {
              $log.log(angular.toJson(status));
              $log.log(angular.toJson(response));

              deferred.reject( {response: response, status: status, routeDisplayed: false });
            }
          });
        }, function(error) {
          deferred.reject(error);
        });

        return deferred.promise;
      }

      function clearRoute() {
        return uiGmapIsReady.promise(1).then(function(instances) {
          if (directionsDisplay) {
            directionsDisplay.setMap(null);
          }

          return true;
        });
      }

      function resizeMap() {
        return isMapReady().then(function (map) {
          /*var mapPoints = [];

           angular.forEach(points, function(point) {
           mapPoints.push(new $window.plugin.google.maps.LatLng(point[0], point[1]));
           });

           var bounds = new $window.plugin.google.maps.LatLngBounds(mapPoints);*/

          var GOOGLE = new $window.plugin.google.maps.LatLng(37.422858, -122.085065);

          return map.moveCamera({
            'target' : GOOGLE
          });
        });
/*        return uiGmapIsReady.promise(1).then(function(instances) {
          return google.maps.event.trigger(instances[0].map, "resize");
        });*/
      }
    });
})();
