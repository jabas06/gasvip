angular.module('starter.controllers')
    .controller('AccountCtrl', function($scope, user, Auth, Ref, $firebaseObject) {
        $scope.vm = {};
        var self = $scope.vm;
        var profile = $firebaseObject(Ref.child('users').child(user.uid));

        self.user = user;
        self.logout = function() { Auth.$unauth(); };


        init();

        // *********************************
        // Internal
        // *********************************

        function init() {
            profile.$bindTo($scope, 'vm.profile');
        }

    });
