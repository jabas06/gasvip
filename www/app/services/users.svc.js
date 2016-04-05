(function() {
  'use strict';
  angular.module('gasvip')

    .factory('usersServices', function ($firebaseRef) {
      return {
        getUserById: getUserById
      };

      // ----------
      // Internal
      // ----------

      function getUserById(userId) {
        return $firebaseRef.users.child(userId).once('value').then(function(snapshot) {
          return snapshot.val();
        });
      }
    });
})();
