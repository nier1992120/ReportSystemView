'use strict';
/*global angular, adBoost*/

adBoost
    .constant('app', {
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
                    controller: 'userLoginCtrl',
                    templateUrl: 'login.html'
                }).state("Login", {
                url: '',
                controller: 'userLoginCtrl',
                templateUrl: 'login.html'
            }).state("login1", {
                url: '/login1',
                controller: 'userLoginCtrl',
                templateUrl: 'login.html'
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
            }).state('strategy', {
                url: '/strategy',
                views: {
                    '': {
                        templateUrl: 'index.html'
                    },
                    'topbar@strategy': {
                        templateUrl: 'topbar.html',
                        controller: "indexCtrl"
                    }, 'sidebar@strategy': {
                        templateUrl: 'sidebar.html',
                        controller: "indexCtrl"
                    }, 'mainbody@strategy': {
                        templateUrl: 'mainbody.html',
                        controller: 'indexCtrl'
                    }
                }
            }).state('adStrategy', {
                url: '/adStrategy',
                views: {
                    '': {
                        templateUrl: 'index.html'
                    },
                    'topbar@adStrategy': {
                        templateUrl: 'topbar.html',
                        controller: "indexCtrl"
                    }, 'sidebar@adStrategy': {
                        templateUrl: 'sidebar.html',
                        controller: "indexCtrl"
                    }, 'mainbody@adStrategy': {
                        templateUrl: 'mainbody.html',
                        controller: 'indexCtrl'
                    }
                }
            }).state('task', {
                url: '/task',
                views: {
                    '': {
                        templateUrl: 'index.html'
                    },
                    'topbar@task': {
                        templateUrl: 'topbar.html',
                        controller: "indexCtrl"
                    }, 'sidebar@task': {
                        templateUrl: 'sidebar.html',
                        controller: "indexCtrl"
                    }, 'mainbody@task': {
                        templateUrl: 'mainbody.html',
                        controller: 'indexCtrl'
                    }
                }
            }).state('resource', {
                url: '/resource',
                views: {
                    '': {
                        templateUrl: 'index.html'
                    },
                    'topbar@resource': {
                        templateUrl: 'topbar.html',
                        controller: "indexCtrl"
                    }, 'sidebar@resource': {
                        templateUrl: 'sidebar.html',
                        controller: "indexCtrl"
                    }, 'mainbody@resource': {
                        templateUrl: 'mainbody.html',
                        controller: 'indexCtrl'
                    }
                }
            }).state('timingTask', {
                url: '/timingTask',
                views: {
                    '': {
                        templateUrl: 'index.html'
                    },
                    'topbar@timingTask': {
                        templateUrl: 'topbar.html',
                        controller: "indexCtrl"
                    }, 'sidebar@timingTask': {
                        templateUrl: 'sidebar.html',
                        controller: "indexCtrl"
                    }, 'mainbody@timingTask': {
                        templateUrl: 'mainbody.html',
                        controller: 'indexCtrl'
                    }
                }
            }).state('document', {
                url: '/document',
                views: {
                    '': {
                        templateUrl: 'index.html'
                    },
                    'topbar@document': {
                        templateUrl: 'topbar.html',
                        controller: "indexCtrl"
                    }, 'sidebar@document': {
                        templateUrl: 'sidebar.html',
                        controller: "indexCtrl"
                    }, 'mainbody@document': {
                        templateUrl: 'mainbody.html',
                        controller: 'indexCtrl'
                    }
                }
            }).state('data', {
                url: '/data',
                views: {
                    '': {
                        templateUrl: 'index.html'
                    },
                    'topbar@data': {
                        templateUrl: 'topbar.html',
                        controller: "indexCtrl"
                    }, 'sidebar@data': {
                        templateUrl: 'sidebar.html',
                        controller: "indexCtrl"
                    }, 'mainbody@data': {
                        templateUrl: 'mainbody.html',
                        controller: 'indexCtrl'
                    }
                }
            }).state('log', {
                url: '/log',
                views: {
                    '': {
                        templateUrl: 'index.html'
                    },
                    'topbar@log': {
                        templateUrl: 'topbar.html',
                        controller: "indexCtrl"
                    }, 'sidebar@log': {
                        templateUrl: 'sidebar.html',
                        controller: "indexCtrl"
                    }, 'mainbody@log': {
                        templateUrl: 'mainbody.html',
                        controller: 'indexCtrl'
                    }
                }
            }).state('test', {
                url: '/test',
                views: {
                    '': {
                        templateUrl: 'index.html'
                    },
                    'topbar@test': {
                        templateUrl: 'topbar.html',
                        controller: "indexCtrl"
                    }, 'sidebar@test': {
                        templateUrl: 'sidebar.html',
                        controller: "indexCtrl"
                    }, 'mainbody@test': {
                        templateUrl: 'mainbody.html',
                        controller: 'indexCtrl'
                    }
                }
            }).state('appAndCampaignSyn', {
                url: '/appAndCampaignSyn',
                views: {
                    '': {
                        templateUrl: 'index.html'
                    },
                    'topbar@appAndCampaignSyn': {
                        templateUrl: 'topbar.html',
                        controller: "indexCtrl"
                    }, 'sidebar@appAndCampaignSyn': {
                        templateUrl: 'sidebar.html',
                        controller: "indexCtrl"
                    }, 'mainbody@appAndCampaignSyn': {
                        templateUrl: 'mainbody.html',
                        controller: 'indexCtrl'
                    }
                }
            }).state('account', {
                url: '/account',
                views: {
                    '': {
                        templateUrl: 'index.html'
                    },
                    'topbar@account': {
                        templateUrl: 'topbar.html',
                        controller: "indexCtrl"
                    }, 'sidebar@account': {
                        templateUrl: 'sidebar.html',
                        controller: "indexCtrl"
                    }, 'mainbody@account': {
                        templateUrl: 'mainbody.html',
                        controller: 'indexCtrl'
                    }
                }
            }).state('notice', {
                url: '/notice',
                views: {
                    '': {
                        templateUrl: 'index.html'
                    },
                    'topbar@notice': {
                        templateUrl: 'topbar.html',
                        controller: "indexCtrl"
                    }, 'sidebar@notice': {
                        templateUrl: 'sidebar.html',
                        controller: "indexCtrl"
                    }, 'mainbody@notice': {
                        templateUrl: 'mainbody.html',
                        controller: 'indexCtrl'
                    }
                }
            }).state('dashboard', {
                url: '/dashboard',
                views: {
                    '': {
                        templateUrl: 'index.html'
                    },
                    'topbar@dashboard': {
                        templateUrl: 'topbar.html',
                        controller: "indexCtrl"
                    }, 'sidebar@dashboard': {
                        templateUrl: 'sidebar.html',
                        controller: "indexCtrl"
                    }, 'mainbody@dashboard': {
                        templateUrl: 'mainbody.html',
                        controller: 'indexCtrl'
                    }
                }
            }).state("userseting", {
                url: '/userseting',
                controller: 'userSetingCtrl',
                templateUrl: 'sadminResetPwd.html'
            }).state('sadmin', {
                url: '/sadmin',
                views: {
                    '': {
                        templateUrl: 'sadminIndex.html'
                    },
                    'header@sadmin': {
                        templateUrl: 'sadminHeader.html',
                        controller: 'indexCtrl'
                    }, 'lefter@sadmin': {
                        templateUrl: 'sadminLefter.html',
                        controller: 'indexCtrl'
                    }, 'righter@sadmin': {
                        templateUrl: 'sadminRighter.html',
                        controller: 'indexCtrl'
                    }
                }
            }).state('sadminParam', {
                url: '/sadminParam',
                views: {
                    '': {
                        templateUrl: 'sadminIndex.html'
                    },
                    'header@sadminParam': {
                        templateUrl: 'sadminHeader.html',
                        controller: 'indexCtrl'
                    }, 'lefter@sadminParam': {
                        templateUrl: 'sadminLefter.html',
                        controller: 'indexCtrl'
                    }, 'righter@sadminParam': {
                        templateUrl: 'sadminRighter.html',
                        controller: 'indexCtrl'
                    }
                }
            }).state('sadminStrategy', {
                url: '/sadminStrategy',
                views: {
                    '': {
                        templateUrl: 'sadminIndex.html'
                    },
                    'header@sadminStrategy': {
                        templateUrl: 'sadminHeader.html',
                        controller: 'indexCtrl'
                    }, 'lefter@sadminStrategy': {
                        templateUrl: 'sadminLefter.html',
                        controller: 'indexCtrl'
                    }, 'righter@sadminStrategy': {
                        templateUrl: 'sadminRighter.html',
                        controller: 'indexCtrl'
                    }
                }
            }).state('sadminTask', {
                url: '/sadminTask',
                views: {
                    '': {
                        templateUrl: 'sadminIndex.html'
                    },
                    'header@sadminTask': {
                        templateUrl: 'sadminHeader.html',
                        controller: 'indexCtrl'
                    }, 'lefter@sadminTask': {
                        templateUrl: 'sadminLefter.html',
                        controller: 'indexCtrl'
                    }, 'righter@sadminTask': {
                        templateUrl: 'sadminRighter.html',
                        controller: 'indexCtrl'
                    }
                }
            }).state('sadminResource', {
                url: '/sadminResource',
                views: {
                    '': {
                        templateUrl: 'sadminIndex.html'
                    },
                    'header@sadminResource': {
                        templateUrl: 'sadminHeader.html',
                        controller: "indexCtrl"
                    }, 'lefter@sadminResource': {
                        templateUrl: 'sadminLefter.html',
                        controller: "indexCtrl"
                    }, 'righter@sadminResource': {
                        templateUrl: 'sadminRighter.html',
                        controller: 'indexCtrl'
                    }
                }
            }).state('sadminAdStrategy', {
                url: '/sadminAdStrategy',
                views: {
                    '': {
                        templateUrl: 'sadminIndex.html'
                    },
                    'header@sadminAdStrategy': {
                        templateUrl: 'sadminHeader.html',
                        controller: 'indexCtrl'
                    }, 'lefter@sadminAdStrategy': {
                        templateUrl: 'sadminLefter.html',
                        controller: 'indexCtrl'
                    }, 'righter@sadminAdStrategy': {
                        templateUrl: 'sadminRighter.html',
                        controller: 'indexCtrl'
                    }
                }
            }).state('sadminPrivateAd', {
                url: '/sadminPrivateAd',
                views: {
                    '': {
                        templateUrl: 'sadminIndex.html'
                    },
                    'header@sadminPrivateAd': {
                        templateUrl: 'sadminHeader.html',
                        controller: 'indexCtrl'
                    }, 'lefter@sadminPrivateAd': {
                        templateUrl: 'sadminLefter.html',
                        controller: 'indexCtrl'
                    }, 'righter@sadminPrivateAd': {
                        templateUrl: 'sadminRighter.html',
                        controller: 'indexCtrl'
                    }
                }
            })
                .state('sadminUsers', {
                    url: '/sadminUsers',
                    views: {
                        '': {
                            templateUrl: 'sadminIndex.html'
                        },
                        'header@sadminUsers': {
                            templateUrl: 'sadminHeader.html',
                            controller: 'indexCtrl'
                        }, 'lefter@sadminUsers': {
                            templateUrl: 'sadminLefter.html',
                            controller: 'indexCtrl'
                        }, 'righter@sadminUsers': {
                            templateUrl: 'sadminRighter.html',
                            controller: 'indexCtrl'
                        }
                    }
                }).state('sadminLog', {
                url: '/sadminLog',
                views: {
                    '': {
                        templateUrl: 'sadminIndex.html'
                    },
                    'header@sadminLog': {
                        templateUrl: 'sadminHeader.html',
                        controller: 'indexCtrl'
                    }, 'lefter@sadminLog': {
                        templateUrl: 'sadminLefter.html',
                        controller: 'indexCtrl'
                    }, 'righter@sadminLog': {
                        templateUrl: 'sadminRighter.html',
                        controller: 'indexCtrl'
                    }
                }
            }).state('sadminNotice', {
                url: '/sadminNotice',
                views: {
                    '': {
                        templateUrl: 'sadminIndex.html'
                    },
                    'header@sadminNotice': {
                        templateUrl: 'sadminHeader.html',
                        controller: 'indexCtrl'
                    }, 'lefter@sadminNotice': {
                        templateUrl: 'sadminLefter.html',
                        controller: 'indexCtrl'
                    }, 'righter@sadminNotice': {
                        templateUrl: 'sadminRighter.html',
                        controller: 'indexCtrl'
                    }
                }
            }).state('sadminTag', {
                url: '/sadminTag',
                views: {
                    '': {
                        templateUrl: 'sadminIndex.html'
                    },
                    'header@sadminTag': {
                        templateUrl: 'sadminHeader.html',
                        controller: 'indexCtrl'
                    }, 'lefter@sadminTag': {
                        templateUrl: 'sadminLefter.html',
                        controller: 'indexCtrl'
                    }, 'righter@sadminTag': {
                        templateUrl: 'sadminRighter.html',
                        controller: 'indexCtrl'
                    }
                }
            }).state('sadminStatistics', {
                url: '/sadminStatistics',
                views: {
                    '': {
                        templateUrl: 'sadminIndex.html'
                    },
                    'header@sadminStatistics': {
                        templateUrl: 'sadminHeader.html',
                        controller: 'indexCtrl'
                    },
                    'lefter@sadminStatistics': {
                        templateUrl: 'sadminLefter.html',
                        controller: 'indexCtrl'
                    },
                    'righter@sadminStatistics': {
                        templateUrl: 'sadminRighter.html',
                        controller: 'indexCtrl'
                    }
                }
            }).state('superAccount', {
                url: '/superAccount',
                views: {
                    '': {
                        templateUrl: 'sadminIndex.html'
                    },
                    'header@superAccount': {
                        templateUrl: 'sadminHeader.html',
                        controller: 'indexCtrl'
                    },
                    'lefter@superAccount': {
                        templateUrl: 'sadminLefter.html',
                        controller: 'indexCtrl'
                    },
                    'righter@superAccount': {
                        templateUrl: 'sadminRighter.html',
                        controller: 'indexCtrl'
                    }
                }
            });
        }
    ]);
