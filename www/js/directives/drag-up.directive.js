angular.module('starter.directives')
    .directive('dragUp', function($ionicGesture) {
        return {
            restrict: 'A',
            link: function($scope, $element, $attr) {
                $ionicGesture.on('dragup', function(e) {
                    e.gesture.stopDetect();
                    e.gesture.preventDefault();
                    $element.parent().addClass('slide-in-up');
                }, $element);
            }
        }
    });