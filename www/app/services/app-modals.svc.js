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

      function showRatingHistory(parameters) {
        return modalLauncher.showModal('app/map/rating-history.html', 'RatingHistoryCtrl as vm', parameters);
      }

      function showRateStation(parameters) {
        return modalLauncher.showModal('app/map/rate-station.html', 'RateStationCtrl', parameters);
      }

      function showMapBottomSheet(parameters) {
        // TODO: refactor map botton sheet
        return modalLauncher.showBottomSheet('app/map/map-bottom-sheet.html', 'MapBottomSheetCtrl as vm', parameters);
      }
    });
})();
