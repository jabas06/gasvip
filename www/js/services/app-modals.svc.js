angular.module('starter.services')
  .factory('appModals', ['modalLauncher', function(modalLauncher){
    // all app modals here
    var service = {
      showRatingHistory: showRatingHistory
    };

    return service;

    function showRatingHistory(station){
      return modalLauncher.show('templates/rating-history.html', 'RatingHistoryCtrl as vm', station);
    }

  }]);
