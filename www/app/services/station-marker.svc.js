(function() {
  'use strict';
  angular.module('gasvip')

    .factory('StationMarker', function () {
      return function StationMarker(station, stationMarkerClickClosure) {

        var self = this;

        angular.forEach(station, function (key) {
          self[key] = station[key];
        });

        self.options = {
          visible: true
        };

        self.onClick = stationMarkerClickClosure(self);
        self.refreshMarkerRating = refreshMarkerRating;

        refreshMarkerRating();

        // ----------
        // Internal
        // ----------

        function refreshMarkerRating() {
          self.ratingValue = getRatingValue();
          self.icon = self.ratingValue >= 4 ? 'img/green-pin.png' : 'img/gray-pin.png';
          self.image = self.ratingValue >= 4 ? 'img/green-station.png' : 'img/gray-station.png';
        }

        function getRatingValue() {

          var usersRating = self.rating ? self.rating.sum / self.rating.count : null;
          var profecoScore = self.profeco ? self.profeco.score : null;
          var totalRating;

          if (profecoScore !== null) {
            // Clear profeco score if its 6 months old
            if ((Date.now() - self.profeco.auditDate) > (86400000 * 30) * self.profecoExpirationMonths) {
              profecoScore = null;
              self.profeco = null;
            }
          }


          if (usersRating !== null && profecoScore !== null) {
            totalRating = usersRating * profecoScore;
          }
          else if (usersRating !== null) {
            totalRating = usersRating;
          }
          else if (profecoScore !== null) {
            totalRating = (5 * profecoScore);
          }
          else {
            totalRating = null;
          }

          return totalRating;
        }
      };

    });
})();
