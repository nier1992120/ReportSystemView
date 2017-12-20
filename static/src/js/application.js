'use strict';
(function (angular) {
    angular.module('adBoost.app', [
        'ui.router'
    ]).config(['$stateProvider', '$urlRouterProvider', function ($stateProvider) {
        $stateProvider
            .state('config.accountManagement', {
                url: '/accountManagement',
                templateUrl: 'accountManagement.html',
                controller: 'accountManagementCtrl'
            }).state('config.productManagement', {
                url: '/productManagement',
                templateUrl: 'productManagement.html',
                controller: 'productManagementCtrl'
            }).state('config.projectGroupManagement', {
                url: '/projectGroupManagement',
                templateUrl: 'projectGroupManagement.html',
                controller: 'projectGroupManagementCtrl'
            }).state('datas.dataImport', {
                url: '/dataImport',
                templateUrl: 'dataImport.html',
                controller: 'dataImportCtrl'
            }).state('datas.dataExport', {
                url: '/dataExport',
                templateUrl: 'dataExport.html',
                controller: 'dataExportCtrl'
            })
    }]);
})(window.angular);
