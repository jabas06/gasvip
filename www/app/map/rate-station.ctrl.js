(function() {
  'use strict';
  angular.module('gasvip')

    .controller('RateStationCtrl', function ($scope, $ionicLoading, ratingsService, user, newStationRating) {
      var vm = this;

      vm.newStationRating = newStationRating;
      vm.close = close;
      vm.submitStationRating = submitStationRating;

      init();

      // ----------
      // Internal
      // ----------

      function submitStationRating(form) {
        if (form.$valid) {
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

            ratingsService.saveRating(rating, vm.newStationRating.ratingNumber).then(function (result) {
              $ionicLoading.hide();

              if (result.error || !result.committed) {
                $cordovaToast.showShortBottom('Tu calificación ha sido guardada y será procesada más tarde');
              }
              else {
                $cordovaToast.showShortBottom('La calificacíón se guardó correctamente.');
                $scope.closeModal(result.rating);
              }

            }).catch(function (error) {
              $ionicLoading.hide();
              $cordovaToast.showShortBottom('Ocurrió un error al enviar la calificación. Intenta nuevamente');
            });
          }
          else {
            closeRateStationModal();
            $cordovaToast.showShortBottom('Debes iniciar sesión');
          }
        }
      }

      function init() {
        $ionicLoading.show();

        ratingsService.getRatingsByStation(vm.station.id).then(function (ratings) {
          vm.ratings = ratings;

          vm.ratingsCount = ratings ? Object.keys(ratings).length : 0;

          $ionicLoading.hide();
        }).catch(function () {
          $ionicLoading.hide();
        });
      }

      function close() {
        $scope.closeModal(null);
      }
    });
})();
