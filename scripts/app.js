'use strict';
var app = angular.module('app.style1', [
    'ngSanitize',
    'caph.ui',
    'caph.media'
]).config(['focusControllerProvider', function (focusControllerProvider) {
    focusControllerProvider.setInitialDepth(1);
}]);