angular.module('starter.controllers')
    .controller('AccountCtrl', function($scope, $ionicLoading, $ionicHistory, $ionicPopover,
                                        user, Auth, Ref, $firebaseObject, $state) {
        $scope.vm = {};
        var self = $scope.vm;
        var profile = $firebaseObject(Ref.child('users').child(user.uid));

        self.user = user;
        self.logout = logout;
        self.goMap = goMap;

        init();

        // *********************************
        // Internal
        // *********************************

        function logout(){
            self.popover.hide();

            $ionicHistory.nextViewOptions({
                disableAnimate: true,
                disableBack: true
            });

            Auth.$unauth();

            $ionicLoading.show();
            $ionicHistory.clearCache().then(function(){ $ionicLoading.hide(); });
        }

        function goMap() {
            $ionicHistory.nextViewOptions({
                disableBack: true
            });

            $state.go('app.map');
        }

        function init() {
            $ionicPopover.fromTemplateUrl('templates/account-popover.html', {
                scope: $scope,
            }).then(function(popover) {
                self.popover = popover;
            });

            $ionicLoading.show();
            profile.$loaded().finally(function() { $ionicLoading.hide(); });

            profile.$bindTo($scope, 'vm.profile');
        }

    });
