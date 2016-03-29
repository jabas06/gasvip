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
        return modalLauncher.showModal('app/map/rating-history.html', 'RatingHistoryCtrl as vm', station);
      }

      function showRateStation(newRating) {
        return modalLauncher.showModal('app/map/rate-station.html', 'RateStationCtrl as vm', newRating);
      }

      function showMapBottomSheet(station) {
        return modalLauncher.showBottomSheet('app/map/map-bottom-sheet.html', 'MapBottomSheetCtrl as vm', station);
      }
    });
})();
