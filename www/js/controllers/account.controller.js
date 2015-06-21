angular.module('starter.controllers')
    .controller('AccountCtrl', function($scope, $ionicHistory, user, Auth, Ref, $firebaseObject) {
        $scope.vm = {};
        var self = $scope.vm;
        var profile = $firebaseObject(Ref.child('users').child(user.uid));

        self.user = user;
        self.logout = logout;


        init();

        // *********************************
        // Internal
        // *********************************

        function logout(){
            $ionicHistory.nextViewOptions({
                disableAnimate: true,
                disableBack: true
            });

            Auth.$unauth();
        }

        function init() {
            profile.$bindTo($scope, 'vm.profile');
        }

    });
