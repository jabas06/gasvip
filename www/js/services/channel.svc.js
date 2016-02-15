angular.module('starter.services')
    .factory('Channel', function(){
      return function () {
        var callbacks = {};

        this.add = function (callBackName, callBack) {
          callbacks[callBackName] = callBack;
        };

        this.invoke = function (callBackName) {
          var args = arguments;
          return callbacks[callBackName].apply(undefined,args);
        };
        return this;
      };
    });