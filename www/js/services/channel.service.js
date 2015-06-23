angular.module('starter.services')
    .factory('Channel', function(){
      return function () {
        var callbacks = [];
        this.add = function (cb) {
          callbacks.push(cb);
        };
        this.invoke = function () {
          var args = arguments;
          callbacks.forEach(function (cb) {
            cb.apply(undefined,args);
          });
        };
        return this;
      };
    });