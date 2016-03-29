/*
 * This is a custom directive to be used with Ionic modalService.
 * The directive will create a modal styled like a bottom sheet
 */
angular.module('ionic')
    .directive('ionBottomSheet', [function() {
        return {
            restrict: 'E',
            transclude: true,
            replace: true,
            controller: [function() {}],
            template: '<div class="modal-wrapper" ng-transclude></div>'
           /* template: '<div class="modal-backdrop">' +
            '<div class="modal-backdrop-bg"></div>' +
            '<div class="modal-wrapper" ng-transclude></div>' +
            '</div>'*/
        };
    }])
    .directive('ionBottomSheetView', function() {
        return {
            restrict: 'E',
            compile: function(element) {
                element.addClass('bottom-sheet modal');
            }
        };
    });