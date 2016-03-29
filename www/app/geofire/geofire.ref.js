(function() {
  'use strict';
  angular.module('gasvip')

    .factory('GeofireRef', function ($window, $firebaseRef) {
      'use strict';
      return new $window.GeoFire($firebaseRef.geofire);
    });
})();
