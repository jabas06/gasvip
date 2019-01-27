(function() {
  "use strict";
  angular
    .module("gasvip")

    .controller("AccountCtrl", function(
      $scope,
      $ionicLoading,
      $ionicHistory,
      $ionicPopover,
      user,
      $firebaseAuth,
      $state,
      usersServices
    ) {
      $scope.vm = {};
      var vm = $scope.vm;

      vm.user = user;
      vm.logout = logout;
      vm.goMap = goMap;

      init();

      // ----------
      // Internal
      // ----------

      function logout() {
        vm.popover.hide();

        $ionicHistory.nextViewOptions({
          disableAnimate: true,
          disableBack: true
        });

        $firebaseAuth().$signOut();

        $ionicLoading.show();
        $ionicHistory.clearCache().then(function() {
          $ionicLoading.hide();
        });
      }

      function goMap() {
        $ionicHistory.nextViewOptions({
          disableBack: true
        });

        $state.go("app.map");
      }

      function init() {
        $ionicLoading.show();

        usersServices
          .getUserById(user.uid)
          .then(function(user) {
            $ionicLoading.hide();

            vm.profile = user;
          })
          .catch(function() {
            $ionicLoading.hide();
          });

        $ionicPopover
          .fromTemplateUrl("app/auth/account-popover.html", {
            scope: $scope
          })
          .then(function(popover) {
            vm.popover = popover;
          });
      }
    });
})();
