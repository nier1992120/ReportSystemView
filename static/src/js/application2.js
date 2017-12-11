'use strict';
(function (angular) {
    angular.module('adBoost.app', [
        'ui.router'
    ]).config(['$stateProvider', '$urlRouterProvider', function ($stateProvider) {
        $stateProvider
        //......................admin之应用管理.....................//
            .state('index.accountManagement', {
                url: '/accountManagement',
                templateUrl: 'accountManagement.html',
                controller: ''
            }).state('index.dataInport', {
                url: '/dataInport',
                templateUrl: 'dataInport.html',
                controller: ''
            }).state('index.dataExport', {
                url: '/dataExport',
                templateUrl: 'dataExport.html',
                controller: ''
            }).state('index.dataUpdate', {
                url: '/dataUpdate',
                templateUrl: 'dataUpdate.html',
                controller: ''
            }).state('index.productManagement', {
                url: '/productManagement',
                templateUrl: 'productManagement.html',
                controller: ''
            }).state('index.projectGroupManagement', {
                url: '/projectGroupManagement',
                templateUrl: 'projectGroupManagement.html',
                controller: ''
            })
    }]);
})(window.angular);
