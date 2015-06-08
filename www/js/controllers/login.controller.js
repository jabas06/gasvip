angular.module('starter.controllers')
    .controller('LoginCtrl', function($scope, $ionicLoading, Auth, Ref) {
        var self =  this;

        self.oauthLogin = oauthLogin;
        self.anonymousLogin = anonymousLogin;

        // *********************************
        // Internal
        // *********************************

        function oauthLogin(provider) {
            self.err = null;

            var options = {};

            if (provider === 'facebook')
            {
                options.scope = 'email,user_likes';
            }

            Auth.$authWithOAuthPopup(provider, options).then(afterSuccessLogin, showError);
        }

        function anonymousLogin() {
            self.err = null;
            Auth.$authAnonymously().then(afterSuccessLogin, showError);
        }

        function afterSuccessLogin(authData)
        {
            if (authData) {
                //Register the user if the account doesn't exist
                Ref.child('users/'+authData.uid).once('value',  function(data) {
                    if (data.val() === null){

                        var userInfo = getUserInfo(authData);

                        Ref.child('users').child(authData.uid).set({

                            name: userInfo.name,
                            email: userInfo.email
                        }, function(error) {
                            if (error) {
                                showError(error);
                            } else {
                                redirect();
                            }
                        });
                    }
                    else {
                        redirect();
                    }
                });
            }
        }

        function redirect() {

            $timeout(function() {
                $location.path('/account');
            });
        }

        function showError(err) {
            $scope.err = err;
        }

        // find a suitable info based on the meta info given by each provider
        function getUserInfo(authData) {
            switch(authData.provider) {
                case 'facebook':
                    return {
                        name: authData.facebook.displayName,
                        email: authData.facebook.email || null
                    };
                case 'google':
                    return {
                        name: authData.google.displayName,
                        email: authData.google.email || null
                    };
            }
        }
    });