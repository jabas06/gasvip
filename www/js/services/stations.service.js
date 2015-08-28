angular.module('starter.services')
    .factory('MapManager', function(uiGmapGoogleMapApi, uiGmapIsReady){

      return function() {



        return {
          load: getAvengers
        };


        function centerMap (position) {

          // $scope.$timeout is needed to trigger the digest cycle when the geolocation arrives and to update all the watchers
          $timeout(function() {
            self.myLocation.latitude = position.coords.latitude;
            self.myLocation.longitude = position.coords.longitude;

            self.map.center = {
              latitude: self.myLocation.latitude,
              longitude: self.myLocation.longitude
            };

            self.myLocationMarker.options.visible = true;

            if (!geoQuery) {
              geoQuery = GeofireRef.query({
                center: [self.myLocation.latitude, self.myLocation.longitude],
                radius: radiusInKm
              });

              geoQuery.on("key_entered", onStationEntered);
              geoQuery.on("ready", onGeoQueryReady);
            }
            else {
              geoQuery.updateCriteria({
                center: [self.myLocation.latitude, self.myLocation.longitude],
                radius: radiusInKm
              });
            }
          });
        }
      }
    });