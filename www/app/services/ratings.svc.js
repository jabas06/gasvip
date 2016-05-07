(function() {
  'use strict';
  angular.module('gasvip')

    .factory('ratingsService', function ($log, $q, $firebaseRef, appConfig) {

      return {
        getRatingsByStation: getRatingsByStation,
        newRatingForStation: newRatingForStation,
        saveRating: saveRating
      };

      // ----------
      // Internal
      // ----------

      function getRatingsByStation(stationId) {
        return $firebaseRef.ratingsByStation.child(stationId).orderByChild('time').limitToLast(100)
          .once('value').then(function (snapshot) {
            var ratings = snapshot.val();

            var ratingsArray = [];

            angular.forEach(ratings, function (value) {
              ratingsArray.push(value);
            });

            return ratingsArray;
          })
      }

      function newRatingForStation(station, user) {
        return $firebaseRef.default.child(getTodayRatingPath(user.uid)).once('value').then(function (snapshot) {
          var currentRatings = snapshot.val();

          var ratingNumber = 1;
          var ratingUid = $firebaseRef.ratings.push().key();
          var alreadyRatedStation = false;

          if (currentRatings !== null) {
            Object.keys(currentRatings).forEach(function (key) {
              var currentKey = parseInt(key);

              if (!isNaN(currentKey)) {
                ratingNumber = currentKey + 1;

                if (currentRatings[currentKey].stationId === station.fbKey)
                  alreadyRatedStation = true;
              }
            });
          }

          if (ratingNumber > appConfig.MAX_RATINGS_BY_USER) {
            return {
              canRateStation: false,
              message: 'Ya has calificado ' + appConfig.MAX_RATINGS_BY_USER + ' gasolineras el día de hoy. Intenta mañana :)'
            };
          }
          else if (alreadyRatedStation === true) {
            return {
              canRateStation: false,
              message: 'Ya has calificado a esta gasolinera el día de hoy. Intenta mañana :)'
            };
          }
          else {
            return {
              canRateStation: true,
              newRating: {
                uid: ratingUid,
                ratingNumber: ratingNumber,
                stationId: station.fbKey,
                name: station.name,
                rating: 0,
                whatToImprove: null,
                comment: null
              }
            };
          }
        });
      }

      function saveRating(rating, ratingNumber, user) {
        var deferred = $q.defer();

        rating.whatToImprove = rating.rating > 3 ? null : rating.whatToImprove;

        var ratingFanout = {};

        ratingFanout[getTodayRatingPath(user.uid) + '/' + ratingNumber] = rating;
        ratingFanout['ratingsByStation/' + rating.stationId + '/' + rating.uid] = rating;
        ratingFanout['ratingsByUser/' + rating.userId + '/' + rating.uid] = angular.copy(rating);
        ratingFanout['ratingsByUser/' + rating.userId + '/' + rating.uid].avatar = null;

        $firebaseRef.default.update(ratingFanout).then(function() {
          $firebaseRef.stations.child(rating.stationId + '/private/rating').transaction(function(currentRating) {
            currentRating = currentRating || {};

            currentRating.sum = (currentRating.sum || 0) + rating.rating;
            currentRating.count = (currentRating.count || 0) + 1;

            return currentRating;

          }).then(function(result) {
            if (!result.committed)
              $log.log('Rating transaction not committed.');

            deferred.resolve({
              rating: result.committed ? result.snapshot.val() : null,
              committed: result.committed
            });
          }, function(error) {
            $log.log('Rating transaction failed. ' + error);

            deferred.resolve({ error: error, committed: false });
          });
        }).catch(function(error) {
          $log.log(error);

          deferred.reject(error)
        });

        return deferred.promise;
      }

      function getTodayRatingPath(userUid) {
        var ratingDateKey = new Date();
        ratingDateKey.setUTCHours(0,0,0,0);

        return 'ratingsByTime/' + ratingDateKey.getTime() + '/' + userUid;
      }
    });
})();
