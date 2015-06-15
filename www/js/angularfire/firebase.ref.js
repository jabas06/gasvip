angular.module('firebase.ref', ['firebase', 'firebase.config'])
    .factory('Ref', ['$window', 'FBURL', function($window, FBURL) {
      'use strict';
      return new $window.Firebase(FBURL);
    }])
    .factory('GeofireRef', ['$window', 'Ref', function($window, Ref) {
      'use strict';
      return new $window.GeoFire(Ref.child('geofire'));
    }]);;
