(function() {
  'use strict';
  angular.module('gasvip')

    .factory('GeofireRef', function ($window, firebaseRefProvider) {
      'use strict';
      return new $window.GeoFire(firebaseRefProvider.child('geofire'));
    });
})();
