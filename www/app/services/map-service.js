(function() {
  'use strict';
  angular.module('gasvip')

    .factory('mapService', function ($q, $log, uiGmapIsReady) {
      var directionsService = null;
      var directionsDisplay = null;

      return {
        fitBoundsToPoints: fitBoundsToPoints,
        calculateRoute: calculateRoute,
        clearRoute: clearRoute,
        resizeMap: resizeMap
      };

      // ----------
      // Internal
      // ----------

      function fitBoundsToPoints(points) {
        return uiGmapIsReady.promise(1).then( function(instances) {
          var bounds = new google.maps.LatLngBounds();

          angular.forEach(points, function(point) {
            bounds.extend(new google.maps.LatLng(point[0], point[1]));
          });

          instances[0].map.fitBounds(bounds);

          return true;
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

        return deferred.promise();
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
        uiGmapIsReady.promise(1).then(function(instances) {
          google.maps.event.trigger(instances[0].map, "resize");
        });
      }
    });
})();
