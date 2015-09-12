angular.module('starter.controllers')
    .controller('LoginCtrl', function($timeout, $log, $state, $ionicHistory, $ionicLoading, $cordovaFacebook, $cordovaToast, Auth, Ref) {
        var self =  this;

        self.oauthLogin = login;
        self.anonymousLogin = anonymousLogin;

        // *********************************
        // Internal
        // *********************************

        function login(provider) {
            if(ionic.Platform.isWebView()){

                $cordovaFacebook.logout()
                    .finally(function() {
                        $cordovaFacebook.getLoginStatus().then(function(result){
                            $log.log('fb login: ' + angular.toJson(result));

                            if (result.status === 'connected') {

                                Auth.$authWithOAuthToken(provider, result.authResponse.accessToken).then(afterSuccessLogin, showError);
                            }
                            else {
                                facebookLogin();
                            }
                        },function(){
                            facebookLogin();
                        });
                    });
            }
            else {
                oauthLogin(provider);
            }
        }

        function facebookLogin() {
            $cordovaFacebook.login(['email', 'user_likes', 'user_about_me']).then(function(result){

                $log.log('fb login: ' + angular.toJson(result));

                if (result.status === 'connected') {

                    Auth.$authWithOAuthToken('facebook', result.authResponse.accessToken).then(afterSuccessLogin, showError);
                }
                else {
                    $cordovaToast.showShortCenter('No pudimos autenticarte');
                }

            }, function(error){
                $log.log('fb login error: ' + angular.toJson(error));
            });
        }

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
            $log.log('fireb login: ' + angular.toJson(error));
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