(function() {
  'use strict';
  angular.module('gasvip')

    .controller('AccountCtrl', function ($scope, $ionicLoading, $ionicHistory, $ionicPopover,
                                         user, $firebaseAuthService, $firebaseRef, $firebaseObject, $state) {
      $scope.vm = {};
      var self = $scope.vm;
      var profile = $firebaseObject($firebaseRef.users.child(user.uid));

      self.user = user;
      self.logout = logout;
      self.goMap = goMap;

      init();

      // ----------
      // Internal
      // ----------

      function logout() {
        self.popover.hide();

        $ionicHistory.nextViewOptions({
          disableAnimate: true,
          disableBack: true
        });

        $firebaseAuthService.$unauth();

        $ionicLoading.show();
        $ionicHistory.clearCache().then(function () {
          $ionicLoading.hide();
        });
      }

      function goMap() {
        $ionicHistory.nextViewOptions({
          disableBack: true
        });

        $state.go('app.map');
      }

      function init() {
        $ionicPopover.fromTemplateUrl('app/auth/account-popover.html', {
          scope: $scope,
        }).then(function (popover) {
          self.popover = popover;
        });

        $ionicLoading.show();
        profile.$loaded().finally(function () {
          $ionicLoading.hide();
        });

        profile.$bindTo($scope, 'vm.profile');
      }

    });
})();
