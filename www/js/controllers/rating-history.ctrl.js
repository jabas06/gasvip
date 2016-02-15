angular.module('starter.controllers')
  .controller('RatingHistoryCtrl', function($scope, $ionicLoading, ratingsService, parameters) {
    var vm = this;

    vm.station = parameters;
    vm.close = close;
    vm.ratingsCount = null;

    init();

    // *********************************
    // Internal
    // *********************************

    function init() {
      $ionicLoading.show();

      ratingsService.getRatingsByStation(vm.station.id).then(function(ratings) {
        vm.ratings = ratings;
        
        vm.ratingsCount = ratings ? Object.keys(ratings).length : 0;

        $ionicLoading.hide();
      }).catch(function () {
        $ionicLoading.hide();
      });
    }

    function close() {
      $scope.closeModal(null);
    };

  });
