(function() {
  'use strict';
  angular.module('gasvip')

    // ------------------------

    // used for route security
    .constant('SECURED_ROUTES', {})
    .constant('LOGIN_REDIRECT_PATH', 'app.login')
    .constant('appConfig', {
      MAX_RATINGS_BY_USER: 2
    })

    .constant('VERSION', '1.0')

    .constant('$ionicLoadingConfig', {
      template: '<ion-spinner></ion-spinner>',
      noBackdrop: true,
      duration: 15000
    })

    .constant('FirebaseUrl', 'https://gasolineras.firebaseio.com/')
    .constant('SIMPLE_LOGIN_PROVIDERS', ['anonymous', 'facebook'])
    // ------------------------
    .config(function (uiGmapGoogleMapApiProvider) {
      uiGmapGoogleMapApiProvider.configure({
        key: 'AIzaSyDVhbumpP6UqOTxLYgk5V9aw377JkK3lwI',
        v: '3.24',
        libraries: 'places'
      });
    })
    .config(function(FirebaseUrl, $firebaseRefProvider) {
      $firebaseRefProvider.registerUrl({
        default: FirebaseUrl,
        geofire: FirebaseUrl + 'geofire',
        users: FirebaseUrl + 'users',
        stations: FirebaseUrl + 'stations',
        ratings: FirebaseUrl + 'ratings',
        ratingsByStation: FirebaseUrl + 'ratingsByStation',
      });
    });
})();
