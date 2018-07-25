(function() {
  'use strict';
  angular.module('gasvip')

    .controller('RateStationCtrl', function ($scope, $ionicLoading, messageService, $firebaseAuthService, ratingsService, catalogs, parameters) {
      var vm = $scope;

      vm.newStationRating = parameters.newRating;
      vm.close = close;
      vm.submitStationRating = submitStationRating;
      vm.whatToImproveIsValid = whatToImproveIsValid;

      vm.improvementAreas = angular.copy(catalogs.improvementAreas);

      init();

      // ----------
      // Internal
      // ----------

      function submitStationRating(form) {
        if (form.$valid) {
          $firebaseAuthService.$waitForAuth().then(function(user) {
            if (user) {
              $ionicLoading.show({
                template: '<ion-spinner></ion-spinner><div>Enviando...</div>',
                noBackdrop: false
              });

              var rating = {
                uid: vm.newStationRating.uid,
                rating: vm.newStationRating.rating,
                time: Firebase.ServerValue.TIMESTAMP,
                comment: vm.newStationRating.comment,
                whatToImprove: vm.newStationRating.whatToImprove,
                stationId: vm.newStationRating.stationId,
                userId: user.uid,
                userName: user.facebook.displayName,
                avatar: user.facebook.profileImageURL || null
              };

              ratingsService.saveRating(rating, vm.newStationRating.ratingNumber, user).then(function (result) {
                $ionicLoading.hide();

                if (result.error || !result.committed) {
                  messageService.showShortBottom('Tu calificación ha sido guardada y será procesada más tarde');
                }
                else {
                  messageService.showShortBottom('La calificacíón se guardó correctamente.');
                  $scope.closeModal(result.rating);
                }

              }).catch(function (error) {
                $ionicLoading.hide();
                messageService.showShortBottom('Ocurrió un error al enviar la calificación. Intenta nuevamente');
              });
            }
            else {
              close();
              messageService.showShortBottom('Debes iniciar sesión');
            }
          }, function(error) {
            messageService.showShortBottom(angular.toJson(error));
          });
        }
      }

      function whatToImproveIsValid(value) {
        return vm.newStationRating.rating > 3 || (angular.isDefined(value) && !!value);
      }

      function close() {
        $scope.closeModal(null);
      }

      function init() {

      }
    });
})();
