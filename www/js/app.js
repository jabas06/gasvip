// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', [
    'ionic',
    'starter.controllers',
    'starter.services',
    'firebase',
    'firebase.ref',
    'firebase.auth',
    'uiGmapgoogle-maps',
    'ngCordova'
])

    .run(function($ionicPlatform) {
        $ionicPlatform.ready(function() {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleLightContent();
            }
        });
    })
/**
 * Adds a special `whenAuthenticated` method onto $stateProvider. This special method,
 * when called, invokes Auth.$requireAuth() service (see Auth.js).
 *
 * The promise either resolves to the authenticated user object and makes it available to
 * dependency injection (see AccountCtrl), or rejects the promise if user is not logged in,
 * forcing a redirect to the /login page
 */
    .config(['$stateProvider', 'SECURED_ROUTES', function($stateProvider, SECURED_ROUTES) {
        // credits for this idea: https://groups.google.com/forum/#!msg/angular/dPr9BpIZID0/MgWVluo_Tg8J
        // unfortunately, a decorator cannot be use here because they are not applied until after
        // the .config calls resolve, so they can't be used during route configuration, so we have
        // to hack it directly onto the $routeProvider object
        $stateProvider.authenticatedState = function(state, route) {
            route.resolve = route.resolve || {};
            route.resolve.user = ['Auth', function(Auth) {
                return Auth.$requireAuth();
            }];
            $stateProvider.state(state, route);
            SECURED_ROUTES[state] = true;
            return $stateProvider;
        };
    }])
    .config(function($stateProvider, $urlRouterProvider) {

        // Ionic uses AngularUI Router which uses the concept of states
        // Learn more here: https://github.com/angular-ui/ui-router
        // Set up the various states which the app can be in.
        // Each state's controller can be found in controllers.js
        $stateProvider

            // setup an abstract state for the tabs directive
            .state('tab', {
                url: "/tab",
                abstract: true,
                templateUrl: "templates/tabs.html"
            })

            // Each tab has its own nav history stack:

            .state('tab.dash', {
                url: '/dash',
                views: {
                    'tab-dash': {
                        templateUrl: 'templates/tab-dash.html',
                        controller: 'DashCtrl'
                    }
                }
            })

            .state('tab.map', {
                url: '/map',
                views: {
                    'tab-map': {
                        templateUrl: 'templates/tab-map.html',
                        controller: 'MapCtrl as vm'
                    }
                }
            })

            .state('tab.chats', {
                url: '/chats',
                views: {
                    'tab-chats': {
                        templateUrl: 'templates/tab-chats.html',
                        controller: 'ChatsCtrl'
                    }
                }
            })

            .state('tab.chat-detail', {
                url: '/chats/:chatId',
                views: {
                    'tab-chats': {
                        templateUrl: 'templates/chat-detail.html',
                        controller: 'ChatDetailCtrl'
                    }
                }
            })

            .state('tab.login', {
                url: '/login',
                views: {
                    'tab-account': {
                        templateUrl: 'templates/login.html',
                        controller: 'LoginCtrl as vm'
                    }
                }
            })

            .authenticatedState('tab.account', {
                url: '/account',
                views: {
                    'tab-account': {
                        templateUrl: 'templates/tab-account.html',
                        controller: 'AccountCtrl'
                    }
                }
            });

        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/tab/map');

    })
    .config(function(uiGmapGoogleMapApiProvider) {
        uiGmapGoogleMapApiProvider.configure({
            key: 'AIzaSyDVhbumpP6UqOTxLYgk5V9aw377JkK3lwI',
            v: '3.20',
            libraries: 'places'
        });
    })
/**
 * Apply some route security. Any route's resolve method can reject the promise with
 * "AUTH_REQUIRED" to force a redirect. This method enforces that and also watches
 * for changes in auth status which might require us to navigate away from a path
 * that we can no longer view.
 */
    .run(['$rootScope', '$state', '$location', 'Auth', 'SECURED_ROUTES', 'loginRedirectState',
        function($rootScope, $state, $location, Auth, SECURED_ROUTES, loginRedirectState) {
            // watch for login status changes and redirect if appropriate
            Auth.$onAuth(check);

            // some of our routes may reject resolve promises with the special {authRequired: true} error
            // this redirects to the login page whenever that is encountered
            $rootScope.$on('$stateChangeError', function(e, toState, toParams, fromState, fromParams, err) {
                event.preventDefault();

                if( err === 'AUTH_REQUIRED' ) {
                    $state.go(loginRedirectState);
                }
            });

            function check(user) {
                if( !user && authRequired($state.current.name) ) {
                    $state.go(loginRedirectState);
                }
            }

            function authRequired(state) {
                return SECURED_ROUTES.hasOwnProperty(state);
            }
        }
    ])
    .run(['$rootScope', 'Auth', function($rootScope, Auth) {
        // track status of authentication
        Auth.$onAuth(function(user) {
            $rootScope.loggedIn = !!user;
        });
    }])

    // used by route security
    .constant('SECURED_ROUTES', {});

angular.module('starter.controllers', []);
angular.module('starter.services', []);