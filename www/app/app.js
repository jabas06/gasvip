(function () {
  'use strict';

  angular.module('gasvip', [
      'ionic',
      'ngMessages',
      'gasvip',
      'firebase',
      'uiGmapgoogle-maps',
      'ui.validate',
      'ngCordova',
      'ngIOS9UIWebViewPatch'
    ])

    .run(function ($ionicPlatform) {
      $ionicPlatform.ready(function () {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins.Keyboard) {
          cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
          cordova.plugins.Keyboard.disableScroll(true);
        }
        if (window.StatusBar) {
          // org.apache.cordova.statusbar required
          StatusBar.styleDefault();
        }
      });
    })

    /**
     * Adds a special `whenAuthenticated` method onto $stateProvider. This special method,
     * when called, invokes $firebaseAuthService.$requireAuth().
     *
     * The promise either resolves to the authenticated user object and makes it available to
     * dependency injection (see AccountCtrl), or rejects the promise if user is not logged in,
     * forcing a redirect to the /login page
     */
    .config(['$stateProvider', 'SECURED_ROUTES', function ($stateProvider, SECURED_ROUTES) {
      // credits for this idea: https://groups.google.com/forum/#!msg/angular/dPr9BpIZID0/MgWVluo_Tg8J
      // unfortunately, a decorator cannot be use here because they are not applied until after
      // the .config calls resolve, so they can't be used during route configuration, so we have
      // to hack it directly onto the $routeProvider object
      $stateProvider.authenticatedState = function (state, route) {
        route.resolve = route.resolve || {};
        route.resolve.user = ['$firebaseAuthService', function ($firebaseAuthService) {
          return $firebaseAuthService.$requireAuth();
        }];
        $stateProvider.state(state, route);
        SECURED_ROUTES[state] = true;

        return $stateProvider;
      };

      $stateProvider.waitForAuthState = function (state, route) {
        route.resolve = route.resolve || {};
        route.resolve.user = ['$firebaseAuthService', function ($firebaseAuthService) {
          return $firebaseAuthService.$waitForAuth();
        }];
        $stateProvider.state(state, route);
        return $stateProvider;
      };

    }])

    /**
     * Apply some route security. Any route's resolve method can reject the promise with
     * "AUTH_REQUIRED" to force a redirect. This method enforces that and also watches
     * for changes in auth status which might require us to navigate away from a path
     * that we can no longer view.
     */
    .run(['$rootScope', '$state', '$location', '$firebaseAuthService', 'SECURED_ROUTES', 'LOGIN_REDIRECT_PATH',
      function ($rootScope, $state, $location, $firebaseAuthService, SECURED_ROUTES, LOGIN_REDIRECT_PATH) {
        // watch for login status changes and redirect if appropriate
        $firebaseAuthService.$onAuth(check);

        // some of our routes may reject resolve promises with the special {authRequired: true} error
        // this redirects to the login page whenever that is encountered
        $rootScope.$on('$stateChangeError', function (e, toState, toParams, fromState, fromParams, err) {
          event.preventDefault();

          if (err === 'AUTH_REQUIRED') {
            $state.go(LOGIN_REDIRECT_PATH);
          }
        });

      /*  $rootScope.side_menu = document.getElementsByTagName('ion-side-menu')[0];*/

/*        $rootScope.$on('$stateChangeSuccess', function (e, toState, toParams, fromState, fromParams, err) {
          console.log(toState);
        });*/

        function check(user) {
          if (!user && authRequired($state.current.name)) {
            $state.go(LOGIN_REDIRECT_PATH);
          }
        }

        function authRequired(state) {
          return SECURED_ROUTES.hasOwnProperty(state);
        }
      }
    ])
    .run(['$rootScope', '$firebaseAuthService', function ($rootScope, $firebaseAuthService) {
      // track status of authentication
      $firebaseAuthService.$onAuth(function (user) {
        $rootScope.loggedIn = !!user;
        $rootScope.globalUser = user;
      });
    }])

    // lodash
    .constant('_', window._)
    // geofire
    .constant('GeoFire', window.GeoFire);
})();
