angular.module('starter.services')
  .factory('ratingsService', function(Ref){

    var service = {
      getRatingsByStation: getRatingsByStation
    };

    return service;

    // ----------
    // Internal
    // ----------

    function getRatingsByStation(stationId) {
      return Ref.child('ratingsByStation/' + stationId).orderByChild("time").limitToLast(100)
        .once('value').then(function (snapshot) {

          return snapshot.val();
      })
    }

  });
