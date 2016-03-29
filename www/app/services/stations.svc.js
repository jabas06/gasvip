(function() {
  'use strict';
  angular.module('gasvip')

    .factory('stationsService', function ($firebaseRef, user) {
      return {
        getStationData: getStationData,
        getPublicStationData: getPublicStationData,
        getPremiumStationData: getPremiumStationData
      };

      // ----------
      // Internal
      // ----------

      function getStationData(stationKey) {
        if (user)
          return getPremiumStationData(stationKey);
        else
          return getPublicStationData(stationKey);
      }

      function getPublicStationData(stationKey) {
        return $firebaseRef.child('stations').child(stationKey).once('value').then(function (snapshot) {
          var station = snapshot.val();

          return {
            id: dataSnapshot.ref().parent().key(),
            pemexId: station.pemexId,
            latitude: station.lat,
            longitude: station.lon,
            name: station.name,
          };
        });
      }

      function getPremiumStationData(stationKey) {
        return $firebaseRef.child('stations').child(stationKey).child('public').once('value').then(function(snapshot) {
          var station = snapshot.val();

          return {
            id : snapshot.key(),
            pemexId : station.public.pemexId,
            latitude : station.public.lat,
            longitude : station.public.lon,
            name : station.public.name,
            profecoExpirationMonths : station.public.profecoExpirationMonths,
            rating : station.private ? station.private.rating : null,
            profeco : station.private ? station.private.profeco : null
          };
        });
      }
    });
})();
