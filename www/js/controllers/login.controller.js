angular.module('starter.controllers')
    .controller('LoginCtrl', function($timeout, $state, $ionicLoading, $cordovaOauth, $cordovaToast, Auth, Ref) {
        var self =  this;

        self.oauthLogin = oauthLogin;
        self.anonymousLogin = anonymousLogin;

        // *********************************
        // Internal
        // *********************************

        function oauthLogin(provider) {
            if (provider === 'facebook')
            {
                $cordovaOauth.facebook('1613952282176354', ['email']).then(function(result) {
                    Auth.$authWithOAuthToken("facebook", result.access_token).then(afterSuccessLogin, showError);
                }, showError);
            }
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
                $state.go('tab.account');
            });
        }

        function showError(err) {
            $cordovaToast
                .showShortCenter(err);
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