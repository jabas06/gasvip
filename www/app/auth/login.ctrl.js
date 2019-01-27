(function() {
  "use strict";
  angular
    .module("gasvip")

    .controller("LoginCtrl", function(
      $timeout,
      $log,
      $state,
      $ionicHistory,
      $ionicLoading,
      $cordovaFacebook,
      messageService,
      $firebaseAuth,
      $firebaseRef
    ) {
      var self = this;

      var loginScopes = ["email"];

      self.oauthLogin = login;
      self.anonymousLogin = anonymousLogin;

      // ----------
      // Internal
      // ----------

      function login(provider) {
        if (!window.cordova) {
          oauthLogin(provider);
          return;
        }

        facebookLogin();
      }

      function facebookLogin() {
        $ionicLoading.show({ template: "Iniciando sesión..." });

        $cordovaFacebook.login(loginScopes).then(
          function(result) {
            $ionicLoading.hide();

            if (result.status === "connected") {
              $ionicLoading.show({ template: "Iniciando sesión..." });
              $firebaseAuth()
                .$signInWithCredential(
                  firebase.auth.FacebookAuthProvider.credential(
                    result.authResponse.accessToken
                  )
                )
                .then(afterSuccessLogin, showError);
            } else {
              messageService.showShortCenter("No pudimos autenticarte");
            }
          },
          function(error) {
            $ionicLoading.hide();
            $log.log("fb login error: " + angular.toJson(error));
          }
        );
      }

      function oauthLogin(provider) {
        var authProvider = null;

        if (provider === "facebook") {
          authProvider = new firebase.auth.FacebookAuthProvider();
          loginScopes.forEach(function(scope) {
            authProvider.addScope(scope);
          });
        }

        $ionicLoading.show({ template: "Iniciando sesión..." });
        $firebaseAuth()
          .$signInWithPopup(authProvider)
          .then(afterSuccessLogin, showError);
      }

      function anonymousLogin() {
        self.err = null;
        $firebaseAuth()
          .$authAnonymously()
          .then(afterSuccessLogin, showError);
      }

      function afterSuccessLogin(authData) {
        if (authData) {
          var userResult = authData.user || authData;

          $ionicLoading.show({ template: "Iniciando sesión..." });
          //Register the user if the account doesn't exist
          $firebaseRef.users.child(userResult.uid).once(
            "value",
            function(data) {
              $ionicLoading.hide();

              var userInfo = getUserInfo(userResult);

              if (data.val() === null) {
                $ionicLoading.show({ template: "Iniciando sesión..." });
                $firebaseRef.users.child(userResult.uid).set(
                  {
                    name: userInfo.name,
                    email: userInfo.email,
                    avatar: userInfo.avatar,
                    gender: userInfo.gender
                  },
                  function(error) {
                    $ionicLoading.hide();

                    if (error) {
                      showError(error);
                    } else {
                      redirect();
                    }
                  }
                );
              } else {
                $firebaseRef.users.child(userResult.uid).update({
                  name: userInfo.name,
                  email: userInfo.email,
                  avatar: userInfo.avatar,
                  gender: userInfo.gender
                });

                redirect();
              }
            },
            showError
          );
        }
      }

      function redirect() {
        $timeout(function() {
          $ionicHistory.nextViewOptions({
            disableAnimate: true,
            disableBack: true
          });

          $ionicHistory.clearCache().then(function() {
            $state.go("app.account");
          });
        });
      }

      function showError(error) {
        $ionicLoading.hide();
        $log.log("fireb login: " + angular.toJson(error));
        messageService.showShortCenter(error);
      }

      // find a suitable info based on the meta info given by each provider
      function getUserInfo(authData) {
        var fbData = authData.providerData[0];
        var fbCachedUserProfile = fbData.cachedUserProfile || {};
        return {
          name: fbData.displayName,
          email: fbData.email || null,
          avatar: fbData.photoURL || null,
          gender: fbCachedUserProfile.gender || null
        };
      }
    });
})();
