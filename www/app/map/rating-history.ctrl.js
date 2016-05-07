angular.module('gasvip')
  .controller('RatingHistoryCtrl', function($scope, $ionicLoading, ratingsService, parameters) {
    var vm = this;

    vm.station = parameters.station;
    vm.close = close;
    vm.ratingsCount = null;

    init();

    // ----------
    // Internal
    // ----------

    function init() {
      $ionicLoading.show();

      ratingsService.getRatingsByStation(vm.station.fbKey).then(function(ratings) {
        vm.ratings = ratings;

        vm.ratingsCount = ratings ? Object.keys(ratings).length : 0;

        $ionicLoading.hide();
      }).catch(function () {
        $ionicLoading.hide();
      });
    }

    function close() {
      $scope.closeModal(null);
    }
  });
