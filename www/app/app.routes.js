(function () {
  'use strict';

  angular.module('gasvip')

    .config(function ($stateProvider, $urlRouterProvider) {

      // Ionic uses AngularUI Router which uses the concept of states
      // Learn more here: https://github.com/angular-ui/ui-router
      // Set up the various states which the app can be in.
      // Each state's controller can be found in controllers.js
      $stateProvider

      // setup an abstract state for the tabs directive
        .state('app', {
          url: "/app",
          abstract: true,
          templateUrl: 'templates/menu.html'
        })

        .waitForAuthState('app.map', {
          url: '/map',
          views: {
            'menuContent': {
              templateUrl: 'templates/map.html',
              controller: 'MapCtrl',
              controllerAs: 'vm'
            }
          }
        })

        .state('app.login', {
          url: '/login',
          views: {
            'menuContent': {
              templateUrl: 'templates/login.html',
              controller: 'LoginCtrl',
              controllerAs: 'vm'
            }
          }
        })

        .authenticatedState('app.account', {
          url: '/account',
          views: {
            'menuContent': {
              templateUrl: 'templates/account.html',
              controller: 'AccountCtrl'
            }
          }
        });

      // if none of the above states are matched, use this as the fallback
      $urlRouterProvider.otherwise('/app/map');

    });
})();
