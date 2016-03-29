angular.module('gasvip')
    .service('mapWidgetsChannel',['Channel',function(Channel){
      return new Channel();
    }]);
