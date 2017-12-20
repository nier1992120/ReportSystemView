'use strict';
/*global angular, adBoost*/

adBoost.constant('app', {
    version: Date.now()
})
    .provider('getFile', ['app',
        function (app) {
            this.html = function (fileName) {
                return '/tpl/' + fileName + '?v=' + app.version;
            };
            this.$get = function () {
                return {
                    html: this.html
                };
            };
        }
    ])
    .config(['$stateProvider', '$urlRouterProvider',

        function ($stateProvider, $urlRouterProvider) {

            $urlRouterProvider.otherwise('/login');

            $stateProvider
                .state("login", {
                    url: '/login',
                    templateUrl: 'login.html',
                    controller: 'userLoginCtrl'
                }).state('index', {
                    url: '/index',
                    views: {
                        '': {
                            templateUrl: 'index.html'
                        },
                        'topbar@index': {
                            templateUrl: 'topbar.html',
                            controller: "indexCtrl"
                        }, 'sidebar@index': {
                            templateUrl: 'sidebar.html',
                            controller: "indexCtrl"
                        }, 'mainbody@index': {
                            templateUrl: 'mainbody.html',
                            controller: "indexCtrl"
                        }
                    }
                }).state('config', {
                    url: '/config',
                    views: {
                        '': {
                            templateUrl: 'index.html'
                        },
                        'topbar@config': {
                            templateUrl: 'topbar.html',
                            controller: "indexCtrl"
                        }, 'sidebar@config': {
                            templateUrl: 'sidebar.html',
                            controller: "indexCtrl"
                        }, 'mainbody@config': {
                            templateUrl: 'mainbody.html',
                            controller: 'indexCtrl'
                        }
                    }
                }).state('datas', {
                    url: '/datas',
                    views: {
                        '': {
                            templateUrl: 'index.html'
                        },
                        'topbar@datas': {
                            templateUrl: 'topbar.html',
                            controller: "indexCtrl"
                        }, 'sidebar@datas': {
                            templateUrl: 'sidebar.html',
                            controller: "indexCtrl"
                        }, 'mainbody@datas': {
                            templateUrl: 'mainbody.html',
                            controller: 'indexCtrl'
                        }
                    }
                })
        }
    ]);
