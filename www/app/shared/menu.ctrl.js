angular.module('gasvip')

  .controller('MenuCtrl', function($scope, $ionicSideMenuDelegate, $ionicPlatform) {

    init();

    // ----------
    // Internal
    // ----------

    function init() {
      $scope.$watch(function(){
        return $ionicSideMenuDelegate.getOpenRatio();
      }, function(newValue, oldValue) {
        $scope.hideLeft = newValue === 0;
      });
    }
  });
