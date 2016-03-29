(function() {
  'use strict';
  angular.module('gasvip')

    .controller('LoginCtrl', function ($timeout, $log, $state, $ionicHistory, $ionicLoading, $cordovaFacebook, $cordovaToast, firebaseAuthService, $firebaseRef) {
      var self = this;

      var loginScope = ['email', 'user_likes', 'user_about_me'];

      self.oauthLogin = login;
      self.anonymousLogin = anonymousLogin;

      // ----------
      // Internal
      // ----------

      function login(provider) {
        if (ionic.Platform.isWebView()) {

          $ionicLoading.show({template: 'Iniciando sesión...'});
          $cordovaFacebook.logout()
            .finally(function () {
              $cordovaFacebook.getLoginStatus().then(function (result) {

                $ionicLoading.hide();

                $log.log('fb login: ' + angular.toJson(result));

                if (result.status === 'connected') {

                  $ionicLoading.show({template: 'Iniciando sesión...'});
                  firebaseAuthService.$authWithOAuthToken(provider, result.authResponse.accessToken).then(afterSuccessLogin, showError);
                }
                else {
                  facebookLogin();
                }
              }, function () {
                $ionicLoading.hide();

                facebookLogin();
              });
            });
        }
        else {
          oauthLogin(provider);
        }
      }

      function facebookLogin() {
        $ionicLoading.show({template: 'Iniciando sesión...'});

        $cordovaFacebook.login(loginScope).then(function (result) {

          $ionicLoading.hide();
          $log.log('fb login: ' + angular.toJson(result));

          if (result.status === 'connected') {

            $ionicLoading.show({template: 'Iniciando sesión...'});
            firebaseAuthService.$authWithOAuthToken('facebook', result.authResponse.accessToken).then(afterSuccessLogin, showError);
          }
          else {
            $cordovaToast.showShortCenter('No pudimos autenticarte');
          }

        }, function (error) {
          $ionicLoading.hide();
          $log.log('fb login error: ' + angular.toJson(error));
        });
      }

      function oauthLogin(provider) {
        var options = {};

        if (provider === 'facebook') {
          options.scope = loginScope.join();
        }

        $ionicLoading.show({template: 'Iniciando sesión...'});
        firebaseAuthService.$authWithOAuthPopup(provider, options).then(afterSuccessLogin, showError);


      }

      function anonymousLogin() {
        self.err = null;
        firebaseAuthService.$authAnonymously().then(afterSuccessLogin, showError);
      }

      function afterSuccessLogin(authData) {
        if (authData) {

          $ionicLoading.show({template: 'Iniciando sesión...'});
          //Register the user if the account doesn't exist
          $firebaseRef.users.child(authData.uid).once('value', function (data) {
            $ionicLoading.hide();

            var userInfo = getUserInfo(authData);

            if (data.val() === null) {

              $ionicLoading.show({template: 'Iniciando sesión...'});
              $firebaseRef.users.child(authData.uid).set({

                name: userInfo.name,
                email: userInfo.email,
                avatar: userInfo.avatar,
                gender: userInfo.gender
              }, function (error) {

                $ionicLoading.hide();

                if (error) {
                  showError(error);
                } else {
                  redirect();
                }
              });
            }
            else {
              $firebaseRef.users.child(authData.uid).update({
                name: userInfo.name,
                email: userInfo.email,
                avatar: userInfo.avatar,
                gender: userInfo.gender
              });

              redirect();
            }
          }, showError);
        }
      }

      function redirect() {
        $timeout(function () {

          $ionicHistory.nextViewOptions({
            disableAnimate: true,
            disableBack: true
          });

          $ionicHistory.clearCache().then(function () {
            $state.go('app.account');
          });

        });
      }

      function showError(error) {
        $ionicLoading.hide();
        $log.log('fireb login: ' + angular.toJson(error));
        $cordovaToast.showShortCenter(error);
      }

      // find a suitable info based on the meta info given by each provider
      function getUserInfo(authData) {
        switch (authData.provider) {
          case 'facebook':
            var fbData = authData.facebook;
            var fbCachedUserProfile = fbData.cachedUserProfile || {};
            console.log(angular.toJson("************facebook*****************"));
            console.log(angular.toJson(fbCachedUserProfile));
            return {
              name: fbData.displayName,
              email: fbData.email || null,
              avatar: fbData.profileImageURL || null,
              gender: fbCachedUserProfile.gender || null
            };
          case 'google':
            return {
              name: authData.google.displayName,
              email: authData.google.email || null
            };
        }
      }
    });
})();
