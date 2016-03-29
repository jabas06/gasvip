(function() {
  'use strict';
  angular.module('gasvip')

    .factory('appModals', function (modalLauncher) {
      return {
        showRatingHistory: showRatingHistory,
        showRateStation: showRateStation,
        showMapBottomSheet :showMapBottomSheet
      };

      // ----------
      // Internal
      // ----------

      function showRatingHistory(station) {
        return modalLauncher.showModal('templates/rating-history.html', 'RatingHistoryCtrl as vm', station);
      }

      function showRateStation(newRating) {
        return modalLauncher.showModal('templates/rate-station.html', 'RateStationCtrl as vm', newRating);
      }

      function showMapBottomSheet(station) {
        return modalLauncher.showBottomSheet('templates/map-bottom-sheet.html', 'MapBottomSheetCtrl as vm', station);
      }
    });
})();
