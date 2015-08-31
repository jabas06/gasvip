angular.module('starter.controllers')
    .controller('LoginCtrl', function($timeout, $state, $ionicHistory, $ionicLoading, $cordovaOauth, $cordovaToast, Auth, Ref) {
        var self =  this;

        self.oauthLogin = oauthLogin;
        self.anonymousLogin = anonymousLogin;

        // *********************************
        // Internal
        // *********************************

        function oauthLogin(provider) {
            var options = {};

            if (provider === 'facebook')
            {
                options.scope = 'email,user_likes,user_about_me';
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
/*                $ionicLoading.show({
                    noBackdrop: false
                });*/

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
                }, showError);
            }
        }

        function redirect() {

            $timeout(function() {
                $ionicLoading.hide();

                $ionicHistory.nextViewOptions({
                    disableAnimate: true,
                    disableBack: true
                });

                $state.go('app.account');
            });
        }

        function showError(error) {
            $ionicLoading.hide();
            $cordovaToast.showShortCenter(error);
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