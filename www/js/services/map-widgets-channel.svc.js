angular.module('starter.services')
    .service('mapWidgetsChannel',['Channel',function(Channel){
      return new Channel();
    }]);