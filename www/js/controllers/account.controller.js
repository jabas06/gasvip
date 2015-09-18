angular.module('starter.controllers')
    .controller('AccountCtrl', function($scope, $ionicLoading, $ionicHistory, user, Auth, Ref, $firebaseObject) {
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
            $ionicLoading.show({template: 'Cargando perfil...'});
            profile.$loaded().finally(function() { $ionicLoading.hide(); });

            profile.$bindTo($scope, 'vm.profile');
        }

    });
