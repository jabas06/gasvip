angular.module('starter.directives')
    .directive('tapOn', function($ionicGesture) {
        return {
            restrict: 'A',
            link: function($scope, $element, $attr) {
                $ionicGesture.on('tap', function(e) {
                    e.gesture.stopDetect();
                    e.gesture.preventDefault();
                    $element.parent('#wrapper').find("nav").removeClass('slide-in-up');
                }, $element);
                $ionicGesture.on('drag', function(e) {
                    e.gesture.stopDetect();
                    e.gesture.preventDefault();
                    $element.parent('#wrapper').find("nav").removeClass('slide-in-up');
                }, $element);
            }
        }
    });