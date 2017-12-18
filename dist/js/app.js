'use strict';
/*global angular*/
var adBoost = angular.module('adBoost', [
    'ngLocale',
    'ngAnimate',
    'ngResource',
    'ngCookies',
    'ui.validate',
    'genTemplates',
    'ng.jsoneditor',
    'ngFileUpload',
    'adBoost.app'
    // 'angularModalService'
    // 'highcharts-ng'
]);

adBoost.config(['$httpProvider', 'app',
    function ($httpProvider, app) {

        // global loading status
        var count = 0,
            loading = false,
            status = {
                count: 0,
                total: 0
            };

        status.cancel = function () {
            count = 0;
            loading = false;
            this.count = 0;
            this.total = 0;
            app.loading(false, this); // end loading
        };

        // global loading start
        $httpProvider.defaults.transformRequest.push(function (data) {
            count += 1;
            status.count = count;
            status.total += 1;
            if (!loading) {
                window.setTimeout(function () {
                    if (!loading && count > 0) {
                        loading = true;
                        app.loading(true, status);
                    }
                }, 1000); // if no response in 1000ms, begin loading
            }

            return data;
        });
        // global loading end
        $httpProvider.defaults.transformResponse.push(function (data) {
            count -= 1;
            status.count = count;
            if (loading && count === 0) {
                status.cancel();
            }
            return data;
        });
        // global error handling
        $httpProvider.interceptors.push(function () {
            return {
                request: function(req) {
                    return req;
                },
                response: function (res) {
                    var error, data = res.data;
                    if (angular.isObject(data)) {
                        app.timestamp = data.timestamp;
                        error = data.code === '201' && data.msg;
                        if(data.code === '301'){
                            app.$state.go('login');
                            return app.q.reject(data);
                        }
                    }

                    if (error) {
                        app.toast.error(error.message, "");
                        return app.q.reject(data);
                    } else {
                        return res;
                    }
                },
                responseError: function (res) {
                    var data = res.data || res,
                        status = res.status || '',
                        message = data.message || (angular.isObject(data) ? 'Error!' : data);

                    if(status === 500){
                        message = "<html><head><title>500 Internal Server Error</title></head><body bgcolor='white'><center><h1>500 Internal Server Error</h1></center><hr></body></html>";
                        app.toast.error(message, status);
                        return app.q.reject(data);
                    }else if (status === 404){
                        message = "<html><head><title>404 File Not Found Error</title></head><body bgcolor='white'><center><h1>404 File Not Found Error</h1></center><hr></body></html>";
                        app.toast.error(message, status);
                        return app.q.reject(data);
                    }

                    app.toast.error(message, status);
                    return app.q.reject(data);
                }
            };
        });
    }
]);
    // .config(['ngClipProvider', function (ngClipProvider) {
    // ngClipProvider.setPath('static/bower_components/zeroclipboard/dist/ZeroClipboard.swf');
    // }])
adBoost.run(['app', '$q', '$rootScope', '$state', '$timeout', '$filter', 'getFile', 'JSONKit', 'toast', 'timing', 'cache', 'restAPI', 'sanitize',
     'CryptoJS', 'promiseGet', 'myConf', 'anchorScroll', 'isVisible', 'applyFn', 'param', 'store', 'i18n-zh',
    function (app, $q, $rootScope, $state, $timeout, $filter, getFile, JSONKit, toast, timing, cache, restAPI, sanitize,
              CryptoJS, promiseGet, myConf, anchorScroll, isVisible, applyFn, param, store, $locale) {
        var unSave = {
                stopUnload: false,
                nextUrl: ''
            },
            global = $rootScope.global = {
                isLogin: true,
                info: {}
            },
            jqWin = $(window);

        function resize() {
            var viewWidth = global.viewWidth = jqWin.width();
            global.viewHeight = jqWin.height();
            global.isPocket = viewWidth < 480;
            global.isPhone = viewWidth < 768;
            global.isTablet = !global.isPhone && viewWidth < 980;
            global.isDesktop = viewWidth >= 980;
        }

        function init() {
            // restAPI.heartbeat.get({}, function (data) {
            //     app.timeOffset = Date.now() - data.timestamp;
            //     data = data.data;
            //     app.union(global, data);
            //     app.version = global.info.version || '';
            //     //app.checkUser();
            // });
        }

        app.q = $q;
        app.store = store;
        app.toast = toast;
        app.param = param;
        app.timing = timing;
        app.$state = $state;
        app.timeout = $timeout;
        app.timeOffset = 0;
        app.timestamp = Date.now();
        app.filter = $filter;
        app.locale = $locale;
        app.anchorScroll = anchorScroll;
        app.isVisible = isVisible;
        app.getFile = getFile;
        app.cache = cache;
        app.restAPI = restAPI;
        app.sanitize = sanitize;
        app.CryptoJS = CryptoJS;
        app.promiseGet = promiseGet;
        app.myConf = myConf;
        app.rootScope = $rootScope;
        angular.extend(app, JSONKit); //添加 JSONKit 系列工具函数
        // app.confirmDialog = confirmDialog;

        app.loading = function (value, status) {
            $rootScope.loading.show = value;
            applyFn();
        };

        app.validate = function (scope, turnoff) {
            var collect = [],
                error = [];
            scope.$broadcast('genTooltipValidate', collect, turnoff);
            app.each(collect, function (x) {
                if (x.validate && x.$invalid) {
                    error.push(x);
                }
            });
            if (error.length === 0) {
                app.validate.errorList = null;
                scope.$broadcast('genTooltipValidate', collect, true);
            } else {
                app.validate.errorList = error;
            }
            return !app.validate.errorList;
        };

        app.checkDirty = function (tplObj, pristineObj, Obj) {
            var data = app.union(tplObj);
            if (data && pristineObj && Obj) {
                app.intersect(data, Obj);
                app.each(data, function (x, key, list) {
                    if (angular.equals(x, pristineObj[key])) {
                        delete list[key];
                    }
                });
                app.removeItem(data, undefined);
                unSave.stopUnload = !app.isEmpty(data);
            } else {
                unSave.stopUnload = false;
            }
            return unSave.stopUnload ? data : null;
        };
        //校验用户是否登录
        app.checkUser = function () {
            return true;
            // global.isLogin = !! global.user && !! global.user.pubid;
        };
        //校验用户账号是否被冻结
        app.checkUserState = function () {
            global.isBeFrozen = global.user.state;
        };
        //重置用户信息
        app.clearUser = function () {
            global.user = null;
            app.checkUser();
        };

        //保存app的名称
        app.saveAppName = function (appkey) {
            restAPI.app.get({
                ID: 'getAppNameByAppkey',
                OP: appkey
            }, function (data) {
                $rootScope.rootAppName = data.data.name;
            });
        };
        
        app.checkFollow = function (user) {
            var me = global.user || {};
            user.isMe = user._id === me._id;
            user.isFollow = !user.isMe && !!app.findItem(me.followList, function (x) {
                return x === user._id;
            });
        };

        // 检查每个权重值在-1和10000之间
        app.checkWeightData = function(data,maxWeight){
            var min = -1;
            //var max = 10000;
            if(angular.isNumber(data)){
                if(data > maxWeight || data < min){
                    return false;
                }else {return true;}
            }else if(angular.isString(data)){
                var dataArr = data.split(",");
                var failedCount = 0;
                angular.forEach(dataArr,function (x) {
                    var weightArr = x.split(":");
                    var weight;
                    if(weightArr.length < 2){
                        weight = parseInt(weightArr[0]);
                    }else{
                        weight = parseInt(weightArr[1]);
                    }
                    if(weight > maxWeight || weight < min){
                        failedCount++;
                    }
                });
                if(failedCount === 0){return true;}else{return false;}
            }else{
                return false;
            }
        };

        $rootScope.loading = {
            show: false
        };
        $rootScope.validateTooltip = {
            validate: true,
            validateMsg: $locale.VALIDATE
        };
        $rootScope.unSaveModal = {
            confirmBtn: $locale.BTN_TEXT.confirm,
            confirmFn: function () {
                if (unSave.stopUnload && unSave.nextUrl) {
                    unSave.stopUnload = false;
                    $timeout(function () {
                        window.location.href = unSave.nextUrl;
                    }, 100);
                }
                return true;
            },
            cancelBtn: $locale.BTN_TEXT.cancel,
            cancelFn: true
        };
        $rootScope.isAsso = true;
        $rootScope.existAsso = false;
        //$rootScope.checkChangedUser = function(){
        //    restAPI.user.get({
        //        ID: 'children'
        //    }, function (data) {
        //        if(data.data){
        //            if(data.data.length>0){
        //                $rootScope.existAsso = true;
        //                $rootScope.AssoUser = app.union(data.data);
        //            }else{
        //                $rootScope.AssoUser = undefined;
        //            }
        //        }
        //        $rootScope.isAsso = false;
        //    });
        //};

        //$rootScope.changedUser = function(u){
        //    restAPI.user.get({
        //        ID: 'switchAsso',
        //        OP: u.user_id
        //    }, function (data) {
        //        app.rootScope.global.user = data.data;
        //        app.store('user', data.data);
        //        app.checkUser();
        //        if(app.$state.includes('dashboard.apps')){
        //            $rootScope.$broadcast("genPagination");
        //        }else{
        //            app.$state.go('dashboard.apps');
        //        }
        //    });
        //};


        $rootScope.goBack = function () {
            window.history.go(-1);
        };

        $rootScope.logout = function () {
            restAPI.user.get({
                ID: 'logout'
            }, function () {
                global.user = null;
                store.clear();
                app.checkUser();
                app.$state.go("login");
            });
        };

        jqWin.resize(applyFn.bind(null, resize()));

        timing(function () { // 保证每360秒内与服务器存在连接，维持session
            if (Date.now() - app.timestamp - app.timeOffset >= 240000) {
                init();
            }
        }, 120000);
        resize();
        init();

    }
]);

'use strict';
(function (angular) {
    angular.module('adBoost.app', [
        'ui.router'
    ]).config(['$stateProvider', '$urlRouterProvider', function ($stateProvider) {
        $stateProvider
        //......................admin之应用管理.....................//
            .state('index.appKey', {
                url: '/appKey',
                templateUrl: 'appKey.html',
                controller: 'appkeyCtrl'
            }).state('index.appInsert', {
            url: '/appInsert',
            templateUrl: 'appInsert.html',
            controller: "appInsertCtrl"
        }).state('index.appModify', {
            url: '/appModify/{appkey}',
            templateUrl: 'appModify.html',
            controller: "appEditCtrl"
        }).state('index.appBascInfo', {
            url: '/appBascInfo',
            templateUrl: 'appBascInfo.html',
            controller: "appBaseCtrl"
        }).state('index.showAppBascInfo', {
            url: '/showAppBascInfo',
            templateUrl: 'showAppBascInfo.html',
            controller: "showAppBaseCtrl"
        }).state('index.paramInject', {
            url: '/paramInject/{appkey}',
            templateUrl: 'paramInject.html',
            controller: 'paramInjectCtrl'
        }).state('index.paramCustom', {
            url: '/paramCustom/{appkey}',
            templateUrl: 'paramCustom.html',
            controller: 'paramCustomCtrl'
        }).state('index.paramCtrl', {
            url: '/paramCtrl/{appkey}',
            templateUrl: 'paramCtrl.html',
            controller: 'sysParamCtrl'
        }).state('index.appSyn', {
            url: '/appSyn',
            templateUrl: 'appSyn.html',
            controller: 'appSynCtrl'
        }).state('index.appAdStrategy', {
            url: '/appAdStrategy',
            templateUrl: 'appAdStrategy.html',
            controller: 'appAdStrategyCtrl'
        }).state('index.appAdPolymerEdit', {
            url: '/appAdPolymerEdit/{id}',
            templateUrl: 'appAdPolymerEdit.html',
            controller: 'adGroupEditCtrl'
        }).state('index.appLink', {
            url: '/appLink',
            templateUrl: 'appLink.html',
            controller: 'appLinkInfoCtrl'
        }).state('index.appTimingTask', {
            url: '/appTimingTask/{appkey}',
            templateUrl: 'appTimingTask.html',
            controller: 'appTimingTaskCtrl'
        })
        //......................dashboard.....................//
            .state('dashboard.index', {
                url: '/index',
                templateUrl: 'dashboard.html',
                controller: 'dashBoardCtrl'
            })

        //..................V2版本发布..................................//

            .state('appAndCampaignSyn.syn', {
                url: '/syn',
                templateUrl: 'appAndCampaignSyn.html',
                controller: 'appAndCampaignSynCtrl'
            }).state('appAndCampaignSyn.synInfo', {
            url: '/synInfo',
            templateUrl: 'appAndCampaignSynInfo.html',
            controller: 'appAndCampaignSynInfoCtrl'
        }).state('appAndCampaignSyn.synStatusLog', {
            url: '/synStatusLog',
            templateUrl: 'appAndCampaignLog.html',
            controller: 'appAndCampaignLogCtrl'
        })

        //......................资源管理.....................//
            .state('resource.resourceList', {
                url: '/resourceList',
                templateUrl: 'resourceList.html',
                controller: 'resInfoCtrl'
            }).state('resource.resourceUpload', {
            url: '/resourceUpload',
            templateUrl: 'resourceUpload.html',
            controller: 'addResCtrl'
        })

        //......................定时任务.....................//
            .state('timingTask.taskAdStrategyInfo', {
                url: '/taskAdStrategyInfo',
                templateUrl: 'sadminPrivateAdInfo.html',
                controller: 'taskAdStrategyInfoCtrl'
            }).state('timingTask.taskAdStrategyInsert', {
            url: '/taskAdStrategyInsert',
            templateUrl: 'sadminPrivateAdInsert.html',
            controller: 'taskAdStrategyInsertCtrl'
        })

        //......................admin之投放管理.....................//
            .state('strategy.strategyInsert', {
                url: '/strategyInsert',
                templateUrl: 'strategyInsert.html',
                controller: 'strategyInsertCtrl'
            }).state('strategy.strategyModify', {
            url: '/strategyModify/{optgroupid}',
            templateUrl: 'strategyModify.html',
            controller: 'strategyModifyCtrl'
        }).state('strategy.strategyInfo', {
            url: '/strategyInfo',
            templateUrl: 'strategyInfo.html',
            controller: 'strategyInfoCtrl'
        })

        //......................admin之任务管理.....................//
            .state('task.taskInsert', {
                url: '/taskInsert',
                templateUrl: 'taskInsert.html',
                controller: 'taskInsertCtrl'
            }).state('task.taskModify', {
            url: '/taskModify/{optgroupid}',
            templateUrl: 'taskModify.html',
            controller: 'taskModifyCtrl'
        }).state('task.taskInfo', {
            url: '/taskInfo',
            templateUrl: 'taskInfo.html',
            controller: 'taskInfoCtrl'
        })

        //......................admin之文档中心.....................//
            .state('document.geoCode', {
                url: '/geoCode',
                templateUrl: 'geoCode.html',
                controller: 'geoCtrl'
            }).state('document.geoextCode', {
            url: '/geoextCode',
            templateUrl: 'geoextCode.html',
            controller: 'geoextCtrl'
        }).state('document.language', {
            url: '/language',
            templateUrl: 'languageCode.html',
            controller: 'languageCtrl'
        }).state('document.syscode', {
            url: '/syscode',
            templateUrl: 'syscode.html'
        }).state('document.marketInfo', {
            url: '/marketInfo',
            templateUrl: 'marketInfo.html',
            controller: 'marketCtrl'
        }).state('document.testid', {
            url: '/testid',
            templateUrl: 'appTestId.html'
        })
        //......................admin之数据统计.....................//
            .state('data.basicStatisticsInfo', {
                url: '/statistics',
                templateUrl: 'statisticsInfo.html',
                controller: 'statisticsInfoCtrl'
            }).state('data.statistics', {
            url: '/statistics/{adtype}',
            templateUrl: 'statistics.html',
            controller: 'statisticsCtrl'
        }).state('data.bannerStatistics', {
            url: '/bannerStatistics/{adtype}',
            templateUrl: 'statistics.html',
            controller: 'statisticsCtrl'
        }).state('data.nativeStatistics', {
            url: '/nativeStatistics/{adtype}',
            templateUrl: 'statistics.html',
            controller: 'statisticsCtrl'
        }).state('data.iconStatistics', {
            url: '/iconStatistics/{adtype}',
            templateUrl: 'statistics.html',
            controller: 'statisticsCtrl'
        }).state('data.pushStatistics', {
            url: '/pushStatistics/{adtype}',
            templateUrl: 'statistics.html',
            controller: 'statisticsCtrl'
        }).state('data.interstitialStatistics', {
            url: '/interstitialStatistics/{adtype}',
            templateUrl: 'statistics.html',
            controller: 'statisticsCtrl'
        }).state('data.moreStatistics', {
            url: '/moreStatistics/{adtype}',
            templateUrl: 'statistics.html',
            controller: 'statisticsCtrl'
        }).state('data.offerStatistics', {
            url: '/offerStatistics/{adtype}',
            templateUrl: 'statistics.html',
            controller: 'statisticsCtrl'
        }).state('data.picStatistics', {
            url: '/picStatistics/{adtype}',
            templateUrl: 'statistics.html',
            controller: 'statisticsCtrl'
        })

        //......................子账户.....................//
            .state('account.subAccount', {
                url: '/subAccount',
                templateUrl: 'subAccount.html',
                controller: 'subAccountCtrl'
            })
            .state('superAccount.superSubAccount', {
                url: '/superSubAccount',
                templateUrl: 'superSubAccount.html',
                controller: 'superSubAccountCtrl'
            })

            //......................admin之操作日志（发布日志）.....................//
            .state('log.logSyn', {
                url: '/logSyn',
                templateUrl: 'logSyn.html',
                controller: 'actionLogCtrl'
            })

            //......................admin之通知模块.....................//
            .state('notice.info', {
                url: '/info',
                templateUrl: 'noticeInfo.html',
                controller: 'noticeInfoCtrl'
            })

            //......................admin之应用测试ID（发布日志）.....................//
            .state('test.testApp', {
                url: '/testApp',
                templateUrl: 'testApp.html',
                controller: 'testAppCtrl'
            }).state('test.testAppPub', {
            url: '/testAppPub',
            templateUrl: 'testAppPub.html',
            controller: 'testAppPubCtrl'
        })

        //......................sadmin之操作日志（发布日志）.....................//
            .state('sadminLog.sadminLogSyn', {
                url: '/sadminLogSyn',
                templateUrl: 'sadminLogSyn.html',
                controller: 'actionLogCtrl'
            }).state('sadminLog.sadminLogLoginIn', {
            url: '/sadminLogLoginIn',
            templateUrl: 'sadminLogLoginIn.html',
            controller: 'actionLogCtrl'
        }).state('sadminLog.sadminLogApp', {
            url: '/sadminLogApp',
            templateUrl: 'sadminLogs.html',
            controller: 'actionLogCtrl'
        }).state('sadminLog.sadminLogOpt', {
            url: '/sadminLogOpt',
            templateUrl: 'sadminLogs.html',
            controller: 'actionLogCtrl'
        }).state('sadminLog.sadminLogAd', {
            url: '/sadminLogAd',
            templateUrl: 'sadminLogAd.html',
            controller: 'actionLogCtrl'
        })

        //......................超管之参数管理.....................//
            .state('sadminParam.sadminParamInjectInfo', {
                url: '/sadminParamInjectInfo',
                templateUrl: 'sadminParamInjectInfo.html',
                controller: 'sadminInjectParamInfoCtrl'
            }).state('sadminParam.sadminParamCtrlInfo', {
            url: '/sadminParamCtrlInfo',
            templateUrl: 'sadminParamCtrlInfo.html',
            controller: 'sadminCtrlParamInfoCtrl'
        })


        //......................超管之投放管理.....................//
            .state('sadminStrategy.sadminStrategyInfo', {
                url: '/sadminStrategyInfo',
                templateUrl: 'sadminStrategyInfo.html',
                controller: 'sadminStrategyInfoCtrl'
            }).state('sadminStrategy.sadminStrategyInsert', {
            url: '/sadminStrategyInsert',
            templateUrl: 'strategyInsert.html',
            controller: 'strategyInsertCtrl'
        }).state('sadminStrategy.sadminStrategyModify', {
            url: '/sadminStrategyModify/{optgroupid}',
            templateUrl: 'strategyModify.html',
            controller: 'strategyModifyCtrl'
        })

        //......................超管之任务管理.....................//
            .state('sadminTask.sadminTaskInfo', {
                url: '/sadminTaskInfo',
                templateUrl: 'sadminTaskInfo.html',
                controller: 'taskInfoCtrl'
            }).state('sadminTask.sadminTaskInsert', {
            url: '/sadminTaskInsert',
            templateUrl: 'sadminTaskInsert.html',
            controller: 'taskInsertCtrl'
        }).state('sadminTask.sadminTaskModify', {
            url: '/sadminTaskModify/{optgroupid}',
            templateUrl: 'sadminTaskModify.html',
            controller: 'sadminTaskModifyCtrl'
        })

        //......................超管之地区管理.....................//

            .state('sadmin.sadminGeoext', {
                url: '/sadminGeoext',
                templateUrl: 'sadminGeoext.html',
                controller: 'sadminGeoextCtrl'
            })

            //......................超管之发布应用....................//
            .state('sadmin.sadminSyn', {
                url: '/sadminSyn',
                templateUrl: 'sadminSyn.html',
                controller: 'sadminSynCtrl'
            })
            //......................超管之市场管理.....................//
            .state('sadmin.saminMarketInfo', {
                url: '/saminMarketInfo',
                templateUrl: 'saminMarketInfo.html',
                controller: 'sadminMarketCtrl'
            })

            //......................超管之资源管理.....................//
            .state('sadminResource.resourceList', {
                url: '/resourceList',
                templateUrl: 'resourceList.html',
                controller: 'resInfoCtrl'
            }).state('sadminResource.resourceUpload', {
            url: '/resourceUpload',
            templateUrl: 'resourceUpload.html',
            controller: 'addResCtrl'
        })

        //......................超管之用户管理.....................//
            .state('sadminUsers.sadminUsersInfo', {
                url: '/sadminUsersInfo',
                templateUrl: 'sadminUsersInfo.html',
                controller: 'sadminUserInfoCtrl'
            })

            //......................超管之系统通知管理.....................//
            .state('sadminNotice.info', {
                url: '/info',
                templateUrl: 'sadminNoticeInfo.html',
                controller: 'sadminNoticeInfoCtrl'
            })
            //......................超管统计分析.......................//
            .state('sadminStatistics.basicStatisticsInfo', {
                url: '/basicStatisticsInfo',
                templateUrl: 'basicStatisticsInfo.html',
                controller: 'basicStatisticsInfoCtrl'
            }).state('sadminStatistics.statisticsInfo', {
            url: '/statisticsInfo/{adtype}',
            templateUrl: 'sadminStatistics.html',
            controller: 'sadminStatisticsCtrl'
        }).state('sadminStatistics.bannerStatistics', {
            url: '/bannerStatistics/{adtype}',
            templateUrl: 'sadminStatistics.html',
            controller: 'sadminStatisticsCtrl'
        }).state('sadminStatistics.nativeStatistics', {
            url: '/nativeStatistics/{adtype}',
            templateUrl: 'sadminStatistics.html',
            controller: 'sadminStatisticsCtrl'
        }).state('sadminStatistics.iconStatistics', {
            url: '/iconStatistics/{adtype}',
            templateUrl: 'sadminStatistics.html',
            controller: 'sadminStatisticsCtrl'
        }).state('sadminStatistics.pushStatistics', {
            url: '/pushStatistics/{adtype}',
            templateUrl: 'sadminStatistics.html',
            controller: 'sadminStatisticsCtrl'
        }).state('sadminStatistics.interstitialStatistics', {
            url: '/interstitialStatistics/{adtype}',
            templateUrl: 'sadminStatistics.html',
            controller: 'sadminStatisticsCtrl'
        }).state('sadminStatistics.moreStatistics', {
            url: '/moreStatistics/{adtype}',
            templateUrl: 'sadminStatistics.html',
            controller: 'sadminStatisticsCtrl'
        }).state('sadminStatistics.offerStatistics', {
            url: '/offerStatistics/{adtype}',
            templateUrl: 'sadminStatistics.html',
            controller: 'sadminStatisticsCtrl'
        }).state('sadminStatistics.picStatistics', {
            url: '/picStatistics/{adtype}',
            templateUrl: 'sadminStatistics.html',
            controller: 'sadminStatisticsCtrl'
        })

        //......................超管之广告管理.....................//
            .state('sadminAdStrategy.sadminAdStrategyInfo', {
                url: '/sadminAdStrategyInfo',
                templateUrl: 'sadminAdStrategyInfo.html',
                controller: 'sadminAdStrategyCtrl'
            }).state('sadminAdStrategy.sadminAdStrategyInsert', {
            url: '/sadminAdStrategyInsert',
            templateUrl: 'sadminAdStrategyInsert.html',
            controller: 'sadminAddAdStrategyCtrl'
        })

        //......................超管之私有广告策略.....................//
            .state('sadminPrivateAd.sadminPrivateAdInfo', {
                url: '/sadminPrivateAdInfo',
                templateUrl: 'sadminPrivateAdInfo.html',
                controller: 'sadminPrivateAdInfoCtrl'
            }).state('sadminPrivateAd.sadminPrivateAdInsert', {
            url: '/sadminPrivateAdInsert',
            templateUrl: 'sadminPrivateAdInsert.html',
            controller: 'sadminPrivateAdInsertCtrl'
        })

        //......................超管之标签管理.....................//
            .state('sadminTag.sadminNewTag', {
                url: '/sadminNewTag',
                templateUrl: 'sadminNewTag.html',
                controller: 'sadminNewTagCtrl'
            }).state('sadminTag.sadminAppTag', {
            url: '/sadminAppTag',
            templateUrl: 'sadminAppTag.html',
            controller: 'sadminAppTagCtrl'
        });
    }]);
})(window.angular);

'use strict';
/*global angular, adBoost*/

adBoost.controller('indexCtrl', ["app", "$scope", "$state", function (app, $scope, $state) {
    app.rootScope.global.user = app.store('user');
    app.checkUser();

    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }
    $scope.$state = $state;

    $scope.platform = app.store("platform");
    $scope.user = app.store("user");
    $scope.isSubAccount = false;
    //如果是子账户,获取子账户权限
    if ($scope.user.subpubid !== null && angular.isDefined($scope.user.subpubid)) {
        app.restAPI.user.get({
            ID: 'getSubAccountJurisdiction',
            OP: $scope.user.subpubid
        }, function (data) {
            if (data.data !== null) {
                $scope.isSubAccount = true;
                $scope.subAccountCompanyName = data.data.company_name;
                $scope.jurisdiction = data.data.jurisdiction;
            } else {
                app.toast.error("账号异常!");
                app.$state.go('login');
            }
        });
    }

    // 获取系统消息
    app.restAPI.user.get({
        ID: 'getNoticeInfoByUser',
        OP: $scope.user.pubid
    }, function (data) {
        if (data.data !== null) {
            app.rootScope.messagecount = data.data.msg_count;
        }
    });

    $scope.backToMainAccount = function () {
        app.restAPI.user.get({
            ID: 'backToMainAccount',
            pubid: $scope.user.mainPubid
        }, function (data) {
            app.store("user", data.data);
            app.$state.go('sadminParam.sadminParamCtrlInfo');
        });
    };

    $scope.$watch("platform", function (newVal, oldVal) {
        if (newVal === oldVal) {
            return;
        }
        app.store("platform", $scope.platform);
        // window.location.reload(true);
        if (app.rootScope.global.user.pub_level === "0") {
            if (app.$state.includes('sadminParam.sadminParamCtrlInfo')) {
                window.location.reload(true);
            } else {
                app.$state.go('sadminParam.sadminParamCtrlInfo');
            }
        } else {
            //检测是不是子账户
            if (!$scope.isSubAccount) {
                if (app.$state.includes('index.appBascInfo')) {
                    window.location.reload(true);
                } else {
                    app.$state.go('index.appBascInfo');
                }
            } else {
                if (app.$state.includes('index.showAppBascInfo')) {
                    window.location.reload(true);
                } else {
                    app.$state.go('index.showAppBascInfo');
                }
            }
        }
    });
}]).controller("dashBoardCtrl", ["$scope", "app", 'highchartsDashBoardOptions', 'Highcharts', 'GetDateStr', function ($scope, app, highchartsDashBoardOptions, Highcharts, GetDateStr) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    var restAPI = app.restAPI,
        highChartsOptions = highchartsDashBoardOptions();

    restAPI.dashboard.get({
        ID: 'getIndexData',
        platform: app.store('platform')
    }, {}, function (data) {
        $scope.appCount = data.data.appCount;
        $scope.appSynCount = data.data.appSynCount;
        $scope.sdkv = data.data.sdkv;
        $scope.CTR = data.data.CTR;
        $scope.CVR = data.data.CVR;
        $scope.CTR_updown = data.data.CTR_updown;
        $scope.CVR_updown = data.data.CVR_updown;
        $scope.installCount = data.data.installCount;
        $scope.logs = data.data.logs;
        highChartsOptions.xAxis.categories = data.data.chartData.categories;
        highChartsOptions.series = data.data.chartData.appChartData;
        Highcharts.chart('chartContainer', highChartsOptions);
    });

    $scope.condition = {
        pname: "",
        adtype: "pic",
        reg: "",
        moreOfferType: "1",
        sdate: GetDateStr(1),
        edate: GetDateStr(1),
        pictype: "",
        ispage: false,
        pubid: $scope.user.pubid
    };

    restAPI.statistics.save({
        ID: 'getPicClickData',
        OP: app.store("platform")
    }, $scope.condition, function (data) {
        if (data.data) {
            data.data.piclist.splice(5, data.data.piclist.length - 5);
            $scope.picStatisticsData = data.data.piclist;
        } else {
            $scope.picStatisticsData = [];
        }
    });


    $scope.toLog = function () {
        app.$state.go("dashboard.index");
    };
    $scope.toStat = function () {
        app.$state.go("data.basicStatisticsInfo");
    };
    $scope.toApp = function () {
        app.$state.go("index.appBascInfo");
    };
    $scope.toAppSyn = function () {
        app.$state.go("appAndCampaignSyn.syn");
    };


}]).controller("showAppBaseCtrl", ["$scope", "$state", "app", function ($scope, $state, app) {

    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    var restAPI = app.restAPI;
    $scope.condition = {};
    $scope.pagination = {};
    $scope.condition.query = "";
    $scope.condition.linkid = "";

    //获取用户所有app
    restAPI.app.save({
        ID: 'getUserAppInPage'
    }, {
        platform: app.store('platform')
    }, function (data) {
        $scope.apps = data.data.apps || [];
        $scope.pagination.pageSize = 15;
        $scope.pagination.totalRow = data.data.totalRow;
        $scope.pagination.pageNumber = 1;
    });

    //获取用户所有应用分组
    restAPI.app.get({
        ID: 'getUserAllLinkid',
        OP: app.store('platform')
    }, function (data) {
        $scope.linkids = data.data;
    });

    $scope.$watch("condition", function (newVal, oldVal) {
        if (newVal === oldVal) {
            return;
        }
        if ($scope.condition.linkid === null) {
            $scope.condition.linkid = "";
        }
        if ($scope.condition.mark === null) {
            $scope.condition.mark = "";
        }
        restAPI.app.save({
            ID: 'getUserAppInPage'
        }, {
            platform: app.store('platform'),
            query: $scope.condition.query,
            linkid: $scope.condition.linkid,
            mark: $scope.condition.mark
        }, function (data) {
            $scope.apps = data.data.apps;
            $scope.pagination.totalRow = data.data.totalRow;
            $scope.pagination.pageNumber = 1;
        });
    }, true);

    $scope.$on('genPagination', function (event, p) {
        if (event.stopPropagation)
            event.stopPropagation();
        if ($scope.condition.linkid === null) {
            $scope.condition.linkid = "";
        }
        if ($scope.condition.mark === null) {
            $scope.condition.mark = "";
        }
        restAPI.app.save({
            ID: 'getUserAppInPage'
        }, {
            platform: app.store('platform'),
            query: $scope.condition.query,
            linkid: $scope.condition.linkid,
            pageNumber: p,
            mark: $scope.condition.mark
        }, function (data) {
            $scope.apps = data.data.apps;
            $scope.pagination.totalRow = data.data.totalRow;
            $scope.pagination.pageNumber = p;
        });
    });
}]).controller("appBaseCtrl", ["$scope", "$state", "app", function ($scope, $state, app) {

    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }
    var restAPI = app.restAPI;
    var transferAppkey;
    var delAppkey;
    var appIndex;
    var campaignAppkey;
    $scope.latestSDKV = app.locale.APP.lastSDKV;

    $scope.options = {
        mode: 'tree',
        modes: ['code', 'form', 'text', 'tree', 'view']
    };
    $scope.condition = {};
    $scope.pagination = {};
    $scope.condition.query = "";
    $scope.condition.linkid = "";
    $scope.tag = {};//应用标记
    $scope.adAuth = app.store("user").adAuth;
    $scope.ad = {};
    $scope.selectedApp = {};

    //获取用户所有app
    restAPI.app.save({
        ID: 'getUserAppInPage'
    }, {
        platform: app.store('platform')
    }, function (data) {
        $scope.apps = data.data.apps || [];
        $scope.pagination.pageSize = 15;
        $scope.pagination.totalRow = data.data.totalRow;
        $scope.pagination.pageNumber = 1;
    });

    //获取用户所有应用分组
    restAPI.app.get({
        ID: 'getUserAllLinkid',
        OP: app.store('platform')
    }, function (data) {
        $scope.linkids = data.data;
    });

    $scope.$watch("condition", function (newVal, oldVal) {
        if (newVal === oldVal) {
            return;
        }
        if ($scope.condition.linkid === null) {
            $scope.condition.linkid = "";
        }
        if ($scope.condition.mark === null) {
            $scope.condition.mark = "";
        }
        restAPI.app.save({
            ID: 'getUserAppInPage'
        }, {
            platform: app.store('platform'),
            query: $scope.condition.query,
            linkid: $scope.condition.linkid,
            mark: $scope.condition.mark
        }, function (data) {
            $scope.apps = data.data.apps;
            $scope.pagination.totalRow = data.data.totalRow;
            $scope.pagination.pageNumber = 1;
        });
    }, true);

    $scope.$on('genPagination', function (event, p) {
        if (event.stopPropagation)
            event.stopPropagation();
        if ($scope.condition.linkid === null) {
            $scope.condition.linkid = "";
        }
        if ($scope.condition.mark === null) {
            $scope.condition.mark = "";
        }
        restAPI.app.save({
            ID: 'getUserAppInPage'
        }, {
            platform: app.store('platform'),
            query: $scope.condition.query,
            linkid: $scope.condition.linkid,
            pageNumber: p,
            mark: $scope.condition.mark
        }, function (data) {
            $scope.apps = data.data.apps;
            $scope.pagination.totalRow = data.data.totalRow;
            $scope.pagination.pageNumber = p;
        });
    });

    $scope.showMessage = function () {
        app.toast.info("复制成功!");
    };

    $scope.showColorTag = function (name, appkey, mark) {
        $scope.appName = name;
        $scope.tag.appkey = appkey;
        $scope.tag.mark = mark;
    };

    //选择标签
    $scope.selectFlag = function (mark) {

        $scope.tag.mark = mark;
    };

    //设置标签
    $scope.setAppMarke = function () {
        restAPI.app.save({
            ID: "setAppMarke"
        }, {
            appkey: $scope.tag.appkey,
            mark: $scope.tag.mark
        }, function () {
            angular.forEach($scope.apps, function (x) {
                if (x.appkey === $scope.tag.appkey) {
                    x.mark = $scope.tag.mark;
                }
            });
            app.toast.info("设置标记成功!");
        });
    };

    //清除标签
    $scope.delAppMarke = function () {
        restAPI.app.save({
            ID: "setAppMarke"
        }, {
            appkey: $scope.tag.appkey,
            mark: '0'
        }, function () {
            angular.forEach($scope.apps, function (x) {
                if (x.appkey === $scope.tag.appkey) {
                    x.mark = '0';
                }
            });
            app.toast.info("清除标记成功!");
        });
    };

    $scope.showAppLinkidModal = function (linkid, index) {
        $scope.appName = $scope.apps[index].name;
        $scope.selectedApp.linkid = linkid;
        $scope.selectedApp.index = index;
    };

    //变更应用的应用组
    $scope.updateAppLinkid = function () {
        var app1 = $scope.apps[$scope.selectedApp.index];

        app.confirmDialog({
            message: "是否更改应用" + app1.name + "的应用组为" + $scope.selectedApp.linkid + "?"
        }, function () {

            restAPI.app.get({
                ID: 'updateAppLinkid',
                platform: app.store("platform"),
                linkid: $scope.selectedApp.linkid,
                appkey: app1.appkey
            }, function () {
                $scope.apps[$scope.selectedApp.index].linkid = $scope.selectedApp.linkid;
                window.location.reload(true);
                app.toast.info("变更成功!");
                $scope.selectedApp = {};
            });
        }, function () {
        });
    };

    $scope.selectDelApp = function (appkey, name, index) {
        delAppkey = appkey;
        $scope.appName = name;
        appIndex = index;
        $scope.selfPassword = "";
    };

    //删除app
    $scope.removeApp = function () {

        var password = app.CryptoJS.SHA256($scope.selfPassword).toString();
        password = app.CryptoJS.HmacSHA256(password, 'blueshocks').toString();
        password = app.CryptoJS.HmacSHA256(password, app.store("user").login_id).toString();

        restAPI.user.get({
            ID: 'checkUser',
            OP: password
        }, function (data) {
            if (data.data === null) {

                restAPI.app.get({
                    ID: 'delApp',
                    OP: delAppkey
                }, function (data) {
                    if (data.data != null) {
                        app.toast.warning(data.data.result);
                    } else {
                        $scope.apps.splice(appIndex, 1);
                        restAPI.app.get({
                            ID: 'getUserAllLinkid',
                            OP: app.store('platform')
                        }, function (data) {
                            $scope.linkids = data.data;
                        });
                        app.toast.success("删除成功！");
                        $("#checkPassword").modal('hide');
                    }
                });
            } else {
                app.toast.error("密码错误!请检查");
            }
        });
    };

    //选择要迁移的应用
    $scope.selectTransferApp = function (appkey, name) {
        transferAppkey = appkey;
        $scope.appName = name;
        $scope.login_id = "";
        $scope.selfPassword = "";
    };

    //迁移应用
    $scope.transferApp = function () {
        if (angular.isUndefined($scope.login_id) || $scope.login_id === "" || $scope.login_id === null) {
            app.toast.info("请输入一个账户!");
            return;
        }

        var password = app.CryptoJS.SHA256($scope.selfPassword).toString();
        password = app.CryptoJS.HmacSHA256(password, 'blueshocks').toString();
        password = app.CryptoJS.HmacSHA256(password, app.store("user").login_id).toString();

        restAPI.user.get({
            ID: 'checkUser',
            OP: password
        }, function (data) {
            if (data.data === null) {
                restAPI.app.save({
                    ID: 'transferApp'
                }, {
                    transferAppkey: transferAppkey,
                    transferLoginId: $scope.login_id
                }, function () {
                    app.toast.info("迁移成功!");
                    app.timeout(function () {
                        window.location.reload(true);
                    }, 500);
                    $("#userselector").modal('hide');
                });
            } else {
                app.toast.error("密码错误!请检查");
            }
        });
    };

    $scope.showAppCampaignModal = function (campaign, appkey, name) {
        campaignAppkey = appkey;
        if (campaign === undefined) {
            $scope.campaign = [];
        } else {
            $scope.campaign = campaign;
        }

        $scope.appName = name;
    };

    $scope.updateAppCampaign = function () {
        if (!($scope.campaign instanceof Array)) {
            app.toast.info("内容不是数组对象!");
            return;
        }
        restAPI.app.save({
            ID: 'updateAppCampaign'
        }, {
            appkey: campaignAppkey,
            campaign: $scope.campaign
        }, function () {

        });
    };
}]).controller('appLinkInfoCtrl', ["app", "$scope", function (app, $scope) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }
    var restAPI = app.restAPI;

    //获取用户所有应用分组
    restAPI.app.get({
        ID: 'getUserAllLinkid',
        OP: app.store('platform')
    }, function (data) {
        $scope.linkids = data.data;
    });

    $scope.showUpdateModal = function (linkid) {
        $scope.srclinkid = linkid;
        $scope.desclinkid = linkid;
    };

    //修改应用组名
    $scope.changeLinkid = function () {
        if ($scope.desclinkid === $scope.srclinkid) {
            return;
        }
        restAPI.app.get({
            ID: 'changeLinkid',
            platform: app.store('platform'),
            srclinkid: $scope.srclinkid,
            desclinkid: $scope.desclinkid
        }, function () {
            $scope.desclinkid = "";
            window.location.reload(true);
            app.toast.info("修改成功");
        });
    };
}]).controller("appInsertCtrl", ["app", "$scope", function (app, $scope) {

    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    var restAPI = app.restAPI;
    var adAuth = app.store("user").adAuth;
    var jsonData = {},
        options = {
            mode: 'tree',
            modes: ['code', 'form', 'text', 'tree', 'view']
        };
    $scope.data = jsonData;
    $scope.options = options;
    $scope.errors = [];
    $scope.callback = function (file) {
        jsonData = JSON.parse(file.content);
        $scope.jsonfile = file;
        $scope.data = jsonData;
        $scope.isJson = ($scope.jsonfile.name.split('.')[1] === 'json');
    };

    //获取用户所有的应用
    restAPI.app.get({
        ID: "getUserAllAppkey",
        OP: app.store('platform')
    }, function (data) {
        $scope.apps = data.data;
    });

    //获取广告策略
    restAPI.app.get({
        ID: 'getDefaultAdStrategy',
        OP: app.store("platform")
    }, function (data) {
        $scope.adStrategy = data.data;
    });

    //获取控制参数模板
    restAPI.app.get({
        ID: 'getParamTmpl',
        OP: app.store('platform')
    }, function (data) {
        $scope.paramTmpl = data.data;
    });

    //获得注入参数模板
    restAPI.app.get({
        ID: 'getInjectTmpl',
        OP: app.store('platform')
    }, function (data) {
        $scope.injectParamTmpl = data.data;
    });

    //获取图片资源
    restAPI.res.get({
        ID: 'getRes',
        OP: app.store('platform')
    }, function (data) {
        $scope.res = data.data;
    });

    if ($scope.isSubAccount) {
        //如果是子账户,获取子账户的应用组权限
        restAPI.app.get({
            ID: 'getUserAllLinkid',
            OP: app.store('platform')
        }, function (data) {
            $scope.linkids = data.data;
        });
    }

    $scope.submit = function () {
        $scope.errors = [];
        var isAppTrue = true;
        //校验json，如果json格式有误，$scope.data为空对象
        var flag = true;
        angular.forEach($scope.data, function () {
            flag = false;
        });
        if (flag) {
            $scope.errors.push({"error": "json为空或json格式有误！请检查后重新上传json文件！"});
            return;
        }

        var data;
        if (!angular.isArray($scope.data)) {
            var a = angular.copy($scope.data);
            data = [];
            data.push(a);
        } else {
            data = angular.copy($scope.data);
        }

        //检验app中的图片是否存在于资源中
        angular.forEach(data, function (x, m) {
            var flag1 = true;
            var URL = "^((https|http|ftp|rtsp|mms)://)?[a-z0-9A-Z]{3}.[a-z0-9A-Z][a-z0-9A-Z]{0,61}?[a-z0-9A-Z].com|net|cn|cc (:s[0-9]{1,4})?(.jpg|.png)?$";
            var re = new RegExp(URL);
            if (!re.test(x.icon)) {

                angular.forEach($scope.res, function (y) {
                    if (x.icon === y.name) {
                        flag1 = false;
                    }
                });
                if (flag1) {
                    $scope.errors.push({"error": "资源中没有第" + m + "个app中的图片，请在资源管理中上传！"});
                    isAppTrue = false;
                }
            }
        });

        //对必须有的字段进行校验
        angular.forEach(data, function (x, m) {
            if (angular.isUndefined(x.name) || x.name === "") {
                $scope.errors.push({"error": "请为第" + m + "个app填写name字段！"});
                isAppTrue = false;
            }
            if (angular.isUndefined(x.pkgname) || x.pkgname === "") {
                $scope.errors.push({"error": "请为第" + m + "个app填写pkgname字段！"});
                isAppTrue = false;
            }
            if (angular.isUndefined(x.linkid) || x.linkid === "") {
                $scope.errors.push({"error": "请为第" + m + "个app填写linkid字段！"});
                isAppTrue = false;
            }
            if (angular.isUndefined(x.push) || x.push === "") {
                $scope.errors.push({"error": "请为第" + m + "个app填写push字段！"});
                isAppTrue = false;
            }
            if (angular.isUndefined(x.icon) || x.icon === "") {
                $scope.errors.push({"error": "请为第" + m + "个app填写icon字段！"});
                isAppTrue = false;
            }
            // if(angular.isUndefined(x.pub_account) || x.pub_account === ""){
            //     $scope.errors.push({"error":"请为第" + m + "个app填写pub_account字段！"});
            //     isAppTrue = false;
            // }

            if (angular.isUndefined(x.platform) || x.platform === "") {
                $scope.errors.push({"error": "请为第" + m + "个app填写platform字段！"});
                isAppTrue = false;
            } else if (x.platform !== app.store('platform')) {
                $scope.errors.push({"error": "第" + m + 1 + "个app不是当前平台下的应用，请检查后再上传！"});
                isAppTrue = false;
            }
        });

        //对上传的app自己的name作重复性判断
        var flag3 = false;
        if (data.length > 0) {
            angular.forEach(data, function (x, m) {
                angular.forEach(data, function (y, n) {
                    if (m !== n && x.name === y.name) {
                        flag3 = true;
                    }
                });
            });
        }
        if (flag3) {
            $scope.errors.push({"error": "上传的app中存在同名的app！，请检查name字段！"});
            isAppTrue = false;
        }

        //查询用户是否已经上传过同名的app
        var flag4 = false;
        angular.forEach(data, function (x) {
            angular.forEach($scope.apps, function (y) {
                if (x.name === y.name) {
                    flag4 = true;
                }
            });
        });
        if (flag4) {
            $scope.errors.push({"error": "该账号下已经存在同名的app，请检查name字段！"});
            isAppTrue = false;
        }

        if (!isAppTrue) {
            return;
        }

        angular.forEach(data, function (x) {
            x.adtype_ctrl = {};
        });

        //添加控制参数模板
        angular.forEach($scope.paramTmpl, function (x) {
            if (x.level === "0") {
                angular.forEach(data, function (y) {
                    y[x.key] = x.value;
                });
            }
            if (x.level === "1") {
                angular.forEach(data, function (y) {
                    y.adtype_ctrl[x.key] = x.value;
                });
            }
        });

        //添加注入参数
        angular.forEach(data, function (x) {
            x.ctrl = $scope.injectParamTmpl;
            x.mark = "0";
        });

        //添加广告策略
        angular.forEach(data, function (x) {
            x.ad = {};
            x.ad.strategy = $scope.adStrategy.value;
            //如果该用户已经开放了广告权限，adStrategyId就为custom
            if (adAuth === "1") {
                x.ad.adStrategyId = "custom";
            } else {
                x.ad.adStrategyId = $scope.adStrategy._id.$oid;
            }

            x.ad.id = {};
        });

        restAPI.app.save({
            ID: "addApp",
            OP: app.store('platform')
        }, data, function (data) {
            if (data.data.errors !== null && data.data.errors !== undefined) {
                $scope.errors = data.data.errors;
            } else {
                app.rootScope.appkeys = data.data;
                app.$state.go("index.appKey");
            }
        }, function () {

        });
    };
}]).controller("appkeyCtrl", ['app', '$scope', '$stateParams', '$timeout', function (app, $scope, $stateParams, $timeout) {

    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    $scope.appkeys = app.rootScope.appkeys;
    $scope.platform = app.store("platform");

    app.toast.info("3秒后自动跳回主界面");
    delete app.rootScope.appkeys;
    $timeout(function () {
        app.$state.go("index.appBascInfo");
    }, 3 * 1000);

}]).controller("appEditCtrl", ["app", "$scope", "$state", "$stateParams", function (app, $scope, $state, $stateParams) {

    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    var restAPI = app.restAPI,
        appkey = $stateParams.appkey,
        user = app.store("user");
    //全局保存AppName
    app.saveAppName(appkey);

    var jsonData = {},
        options = {
            mode: 'tree',
            modes: ['code', 'form', 'text', 'tree', 'view']
        };
    $scope.data = jsonData;
    $scope.options = options;
    $scope.errors = [];

    //获取图片资源
    restAPI.res.get({
        ID: 'getRes',
        OP: app.store('platform')
    }, function (data) {
        $scope.res = data.data;
    });

    //获取用户所有应用信息
    restAPI.app.get({
        ID: "getAppByAppkey",
        OP: appkey
    }, function (data) {
        $scope.app = data.data.apps;
        // $scope.app.icon = $scope.app.icon.replace("_" + user.pubid, "");
        $scope.appTmpl = data.data.protectedApps;
    });

    $scope.submit = function () {
        $scope.errors = [];
        var isAppTrue = true;

        if (angular.isUndefined($scope.app.push)) {
            $scope.errors.push({"error": "push字段不能删除！请刷新后重新编辑！"});
            isAppTrue = false;
        }
        // if(angular.isUndefined($scope.app.pub_account)){
        //     $scope.errors.push({"error" : "pub_account字段不能删除！请刷新后重新编辑！"});
        //     isAppTrue = false;
        // }

        //检验app中的图片是否存在于资源中
        var flag1 = true;
        var URL = "^((https|http|ftp|rtsp|mms)://)?[a-z0-9A-Z]{3}.[a-z0-9A-Z][a-z0-9A-Z]{0,61}?[a-z0-9A-Z].com|net|cn|cc (:s[0-9]{1-4})?(.jpg|.png)?$";
        var re = new RegExp(URL);
        if (!re.test($scope.app.icon)) {

            angular.forEach($scope.res, function (y) {
                if ($scope.app.icon === y.name) {
                    flag1 = false;
                }
            });
            if (flag1) {
                $scope.errors.push({"error": "资源中没有app中的icon图片，请在资源管理中上传或者修改icon！"});
                isAppTrue = false;
            }

            var iconName = $scope.app.icon.split("_");
            if (iconName.length !== 3) {
                $scope.errors.push({"error": "icon格式有误,正确格式:appname_ic_1.png！"});
                isAppTrue = false;
            }
        }

        if (!isAppTrue) {
            return;
        }

        //添加隐藏的字段
        angular.extend($scope.app, $scope.appTmpl);

        restAPI.app.save({
            ID: "updateApp",
            OP: appkey
        }, $scope.app, function (data) {
            if (data.data !== null) {
                if (data.data.errors !== null && data.data.errors !== undefined) {
                    $scope.errors = data.data.errors;
                    //如果没有修改成功,还原app状态
                    for (var name in $scope.appTmpl) {
                        delete $scope.app[name];
                    }
                }
            } else {
                $state.go("index.appBascInfo");
            }
        }, function () {
            //如果没有修改成功,还原app状态
            for (var name in $scope.appTmpl) {
                delete $scope.app[name];
            }
        });
    };
}]).controller("sysParamCtrl", ["app", "$scope", "$stateParams", function (app, $scope, $stateParams) {

    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    var restAPI = app.restAPI,
        appkey = $stateParams.appkey;
    //全局保存AppName
    app.saveAppName(appkey);

    var options = {
        mode: 'tree',
        modes: ['code', 'form', 'text', 'tree', 'view']
    };
    $scope.options = options;

    $scope.user = app.store('user');
    $scope.myapps = [];
    $scope.selectAllFlag = false;
    $scope.condition = {};
    $scope.condition.query = "";
    var groups;

    //获取用户级别控制参数
    restAPI.sadmin.get({
        ID: 'getCtrlUserParam',
        OP: app.store("platform")
    }, function (data) {
        var userCtrlParams = data.data;

        //获取用户所有控制参数
        restAPI.app.get({
            ID: 'getAppCtrlUserParam',
            OP: appkey,
            platform: app.store("platform")
        }, function (data) {
            $scope.params = data.data;
            angular.forEach($scope.params, function (x) {
                if (x.value instanceof Array) {
                    x.type = "2";
                } else if (x.value instanceof Object) {
                    x.type = "3";
                } else {
                    x.type = "1";
                }
            });

            angular.forEach($scope.params, function (x) {
                angular.forEach(userCtrlParams, function (y) {
                    if (x.key === y.key) {
                        x.note = y.note;
                    }
                });
            });
        });
    });

    //获取用户所有应用分组
    restAPI.app.get({
        ID: 'getUserAllAppGroup',
        platform: app.store('platform')
    }, function (data) {
        groups = angular.copy(data.data);
        $scope.groups = data.data;
        angular.forEach($scope.groups, function (x) {
            x.apps = x.apps.filter(function (y) {
                return y.appkey !== appkey;
            });
        });
    });

    //打开编辑model
    $scope.showModel = function (index) {
        $scope.errors = [];
        $scope.myapps = [];
        $scope.selectAllFlag = false;
        $scope.showParam = angular.copy($scope.params[index]);

        angular.forEach($scope.groups, function (x) {
            angular.forEach(x.apps, function (y) {
                y.checked = false;
            });
        });
    };

    //添加搜索监控
    $scope.$watch(function () {
        return $scope.condition.query;
    }, function (newVal, oldVal) {
        //初始跳过
        if (newVal === oldVal) {
            return;
        }
        $scope.groups = angular.copy(groups);
        angular.forEach($scope.groups, function (x) {
            angular.forEach(x.apps, function (y) {
                y.checked = false;
                angular.forEach($scope.myapps, function (z) {
                    if (y.appkey === z.appkey) {
                        y.checked = true;
                    }
                });
            });
        });
        if ($scope.condition.query !== "") {
            angular.forEach($scope.groups, function (x) {
                x.apps = x.apps.filter(function (y) {
                    return y.name.indexOf($scope.condition.query) > -1;
                });
            });
        }
    });

    //缓存选中的app
    $scope.addToMyApp = function (app) {
        if (app.checked) {
            $scope.myapps = $scope.myapps.filter(function (x) {
                return x.appkey !== app.appkey;
            });
            app.checked = !app.checked;
        } else {
            app.checked = !app.checked;
            var flag = false;
            angular.forEach($scope.myapps, function (x) {
                if (x.appkey === app.appkey) {
                    flag = true;
                }
            });
            if (!flag) {
                $scope.myapps.push({appkey: app.appkey});
            }
        }

    };

    $scope.selectAll = function () {
        if ($scope.selectAllFlag) {
            $scope.myapps = [];
            angular.forEach($scope.groups, function (x) {
                angular.forEach(x.apps, function (y) {
                    y.checked = false;
                });
            });
        } else {
            $scope.myapps = [];
            angular.forEach($scope.groups, function (x) {
                angular.forEach(x.apps, function (y) {
                    y.checked = true;
                    $scope.myapps.push({appkey: y.appkey});
                });
            });
        }
        $scope.selectAllFlag = !$scope.selectAllFlag;
    };

    $scope.updateParamToOtherApp = function (param) {
        $scope.errors = [];
        if (param.type === "2" && !(param.value instanceof Array)) {
            $scope.errors.push({error: "json数组格式不对,请检查!"});
            return;
        }

        if (param.type === "1" && !(typeof (param.value) === 'string')) {
            $scope.errors.push({error: "不是String,请检查!"});
            return;
        }

        if (param.type === "3" && !(param.value instanceof Object)) {
            $scope.errors.push({error: "json对象格式不对,请检查!"});
            return;
        }

        if (param.value === undefined || param.value === null || param.value === "") {
            app.toast.info("参数不能为空！");
            return;
        }
        //控制参数ad_weight的value数组长度为1的时候,switch不能为0
        if (param.key === "ad_weight" && param.value.length === 1) {
            if (param.value[0].switch === "0") {
                app.toast.info("数组长度为1的时候,switch不能为0！");
                return;
            }
            angular.forEach(param.value, function (x) {
                if (angular.isUndefined(x.priority) || x.priority === null || x.priority === "") {
                    x.priority = "1";
                }
            });
        }

        // 判断switch是否全部是0，没有switch也是0
        if (param["key"] == 'ad_weight') {
            var value = param["value"];
            var index = 0;
            while (index < value.length) {
                if (value[index]["switch"] == "1") {
                    break;
                }
                index++;
            }
            if (index == value.length) {
                app.toast.error("请至少保证有一个开关是开启状态（switch:1）");
                return;
            }

            var failedCount = 0;
            angular.forEach(value, function (x) {
                var weightStr = x.weight;
                var weightArr = weightStr.split(":");
                angular.forEach(weightArr, function (y) {
                    var weight = parseInt(y);
                    if (weight < -1 || weight > 10000) {
                        failedCount++;
                    }
                });
            });
            if (failedCount > 0) {
                app.toast.error("请将权重weight设置在-1和10000之间！");
                return;
            }
        }


        if (param["key"] == 'max_task_daily') {
            var value = param["value"];
            var tt = /^\d+$/g;
            if (!tt.test(value) || value == 0) {
                app.toast.error("请将参数max_task_daily设置为正整数！");
                return;
            }
        }


        //添加自己
        $scope.myapps.push({appkey: appkey});

        restAPI.app.save({
            ID: 'updateAppSysParamToOtherApp',
            OP: app.store("platform")
        }, {
            apps: $scope.myapps,
            param: param
        }, function () {
            angular.forEach($scope.params, function (x) {
                if (param.key === x.key) {
                    x.value = param.value;
                }
            });
            app.toast.info("更新成功!");
            $("#paramTmplBatch").modal('hide');
        });
    };
}]).controller("paramInjectCtrl", ["app", "$scope", "$stateParams", function (app, $scope, $stateParams) {

    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    var restAPI = app.restAPI,
        appkey = $stateParams.appkey;
    //全局保存AppName
    app.saveAppName(appkey);

    var paramkeys = ["geo", "areacode", "resolution", "oscode", "vcode", "sdkcode", "time", "date", "net", "adtype",
        "page", "entry", "market", "ad_family", "language", "devicetype", "usergroup", "category", "tag", "vtime", "level",
        "icon_template", "cross_filter", "gift_template", "check_ctrl", "devicemodel", "ipfeature", "ip"];
    $scope.user = app.store("user");
    $scope.myapps = [];
    $scope.myparams = [];
    $scope.selectAllFlag = false;
    $scope.condition = {};
    $scope.condition.query = "";
    var groups;

    //按分组获取用户所有应用
    restAPI.app.get({
        ID: 'getUserAllAppGroup',
        platform: app.store('platform')
    }, function (data) {
        groups = angular.copy(data.data);
        $scope.groups = data.data;
        angular.forEach($scope.groups, function (x) {
            x.apps = x.apps.filter(function (y) {
                return y.appkey !== appkey;
            });
        });
    });

    //获取注入参数
    restAPI.sadmin.get({
        ID: 'getInjectParam',
        OP: app.store("platform")
    }, function (data) {
        var injectParams = data.data;

        //获取用户注入参数
        restAPI.app.get({
            ID: 'getAppInjectedParam',
            appkey: appkey,
            platform: app.store('platform')
        }, function (data) {
            if (data.data !== null) {
                $scope.myparams = data.data;
            }
            //添加备注
            angular.forEach($scope.myparams, function (x) {
                angular.forEach(injectParams, function (y) {
                    if (x.name === y.name) {
                        x.note = y.note;
                    }
                });
            });
        });
    });

    //打开编辑model
    $scope.showModel = function (param) {
        $scope.myapps = [];
        $scope.selectAllFlag = false;

        $scope.showParam = param;
        $scope.errors = [];

        angular.forEach($scope.groups, function (x) {
            angular.forEach(x.apps, function (y) {
                y.checked = false;
            });
        });
    };

    //添加搜索监控
    $scope.$watch(function () {
        return $scope.condition.query;
    }, function (newVal, oldVal) {
        //初始跳过
        if (newVal === oldVal) {
            return;
        }
        $scope.groups = angular.copy(groups);
        angular.forEach($scope.groups, function (x) {
            angular.forEach(x.apps, function (y) {
                y.checked = false;
                angular.forEach($scope.myapps, function (z) {
                    if (y.appkey === z.appkey) {
                        y.checked = true;
                    }
                });
            });
        });
        if ($scope.condition.query !== "") {
            angular.forEach($scope.groups, function (x) {
                x.apps = x.apps.filter(function (y) {
                    return y.name.indexOf($scope.condition.query) > -1;
                });
            });
        }
    });

    $scope.addToMyApp = function (app) {

        if (app.checked) {
            $scope.myapps = $scope.myapps.filter(function (x) {
                return x.appkey !== app.appkey;
            });
            app.checked = !app.checked;
        } else {
            app.checked = !app.checked;
            $scope.myapps.push({appkey: app.appkey});
        }
    };

    $scope.selectAll = function () {
        $scope.myapps = [];

        if ($scope.selectAllFlag) {
            angular.forEach($scope.groups, function (x) {
                angular.forEach(x.apps, function (y) {
                    y.checked = false;
                });
            });
        } else {
            angular.forEach($scope.groups, function (x) {
                angular.forEach(x.apps, function (y) {
                    $scope.myapps.push({appkey: y.appkey});
                    y.checked = true;
                });
            });
        }

        $scope.selectAllFlag = !$scope.selectAllFlag;
    };

    $scope.updateInjectedParamToApp = function (param) {
        $scope.errors = [];
        var istrue = true;

        //对控制开关进行验证
        if (param.switch.trim() === "") {
            $scope.errors.push({error: "开关只能是0或者1,1代表开启,0代表关闭"});
            return;
        }
        if ("01".indexOf(param.switch) === -1) {
            $scope.errors.push({error: "开关只能是0或者1,1代表开启,0代表关闭"});
            istrue = false;
        }

        if (param.open_condition !== undefined && param.open_condition !== null && param.open_condition !== "") {
            var openCondition1 = param.open_condition.split("$$");
            var openCondition = [];
            angular.forEach(openCondition1, function (x) {
                var temp = x.split("||");
                angular.forEach(temp, function (y) {
                    openCondition.push(y);
                });
            });

            //对条件作格式判断
            angular.forEach(openCondition, function (x, m) {
                if (x.indexOf(":") === -1 || x.indexOf(":") !== x.lastIndexOf(":")) {
                    $scope.errors.push({error: "条件中的第" + (m + 1) + "个条件的格式不对! key与value之间没有用':'分隔或是有多个':', 多个条件之间用'$$'分隔"});
                    istrue = false;
                }

                var key = x.substr(0, x.indexOf(":"));
                if (key.indexOf("_") === -1) {
                    $scope.errors.push({error: "条件中的第" + (m + 1) + "个条件的名称不对,请查看文档中心-系统编码!"});
                    istrue = false;
                } else {
                    if (key.indexOf("_") === key.lastIndexOf("_")) {
                        if (key.indexOf("_in") !== -1) {
                            key = key.substr(0, key.indexOf("_in"));
                        } else if (key.indexOf("_out") !== -1) {
                            key = key.substr(0, key.indexOf("_out"));
                        }
                        var flag = false;
                        angular.forEach(paramkeys, function (y) {
                            if (y === key) {
                                flag = true;
                            }
                        });

                        if (!flag) {
                            $scope.errors.push({error: "条件中的第" + (m + 1) + "个条件的名称不对,请查看文档中心-系统编码!"});
                            istrue = false;
                        }
                    } else {
                        $scope.errors.push({error: "条件中的第" + (m + 1) + "个条件的名称不对,请查看文档中心-系统编码!"});
                        istrue = false;
                    }
                }
            });
        }

        if (!istrue) {
            return;
        }

        delete param.checked;
        //添加自己
        $scope.myapps.push({appkey: appkey});

        restAPI.app.save({
            ID: 'updateAppInjectedParamToApp',
            OP: app.store("platform")
        }, {
            apps: $scope.myapps,
            param: param
        }, function () {
            $("#paramTmplBatch").modal('hide');
        });
    };
}]).controller("paramCustomCtrl", ["app", "$scope", "$stateParams", function (app, $scope, $stateParams) {

    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    var restAPI = app.restAPI,
        appkey = $stateParams.appkey;
    //全局保存AppName
    app.saveAppName(appkey);

    $scope.user = app.store("user");
    $scope.selectAllFlag = false;

    $scope.myapps = [];
    $scope.condition = {};
    $scope.condition.query = "";
    var groups;
    var editParamIndex;

    //获取用户所有app
    restAPI.app.get({
        ID: 'getUserAllAppkey',
        OP: app.store('platform')
    }, function (data) {
        $scope.appkeys = data.data.filter(function (x) {
            return x.appkey !== appkey;
        });
    });

    //按分组获取用户所有应用
    restAPI.app.get({
        ID: 'getUserAllAppGroup',
        platform: app.store('platform')
    }, function (data) {
        groups = angular.copy(data.data);
        $scope.groups = data.data;
        angular.forEach($scope.groups, function (x) {
            x.apps = x.apps.filter(function (y) {
                return y.appkey !== appkey;
            });
        });
    });

    //获取用户扩展参数
    restAPI.app.get({
        ID: 'getAppExtendParam',
        OP: appkey
    }, function (data) {
        $scope.myparams = data.data || [];
    });

    $scope.addParam = function () {
        var param = {key: "", value: "", note: ""};
        $scope.myapps = [];
        $scope.selectAllFlag = false;

        angular.forEach($scope.groups, function (x) {
            angular.forEach(x.apps, function (y) {
                y.checked = false;
            });
        });
        $scope.showParam = param;
        $scope.isAddNewParam = true;
    };

    $scope.closeModel = function () {
        $scope.isAddNewParam = false;
    };

    //打开编辑model
    $scope.showModel = function (param) {
        $scope.myapps = [];
        $scope.selectAllFlag = false;

        $scope.showParam = angular.copy(param);
        editParamIndex = $scope.myparams.indexOf(param);

        angular.forEach($scope.groups, function (x) {
            angular.forEach(x.apps, function (y) {
                y.checked = false;
            });
        });
    };
    //添加搜索监控
    $scope.$watch(function () {
        return $scope.condition.query;
    }, function (newVal, oldVal) {
        //初始跳过
        if (newVal === oldVal) {
            return;
        }
        $scope.groups = angular.copy(groups);
        angular.forEach($scope.groups, function (x) {
            angular.forEach(x.apps, function (y) {
                y.checked = false;
                angular.forEach($scope.myapps, function (z) {
                    if (y.appkey === z.appkey) {
                        y.checked = true;
                    }
                });
            });
        });
        if ($scope.condition.query !== "") {
            angular.forEach($scope.groups, function (x) {
                x.apps = x.apps.filter(function (y) {
                    return y.name.indexOf($scope.condition.query) > -1;
                });
            });
        }
    });

    $scope.addToMyApp = function (app) {
        if (app.checked) {
            $scope.myapps = $scope.myapps.filter(function (x) {
                return x.appkey !== app.appkey;
            });
            app.checked = !app.checked;
        } else {
            app.checked = !app.checked;
            $scope.myapps.push({appkey: app.appkey});
        }
    };

    $scope.selectAll = function () {
        $scope.myapps = [];

        if ($scope.selectAllFlag) {
            angular.forEach($scope.groups, function (x) {
                angular.forEach(x.apps, function (y) {
                    y.checked = false;
                });
            });
        } else {
            angular.forEach($scope.groups, function (x) {
                angular.forEach(x.apps, function (y) {
                    $scope.myapps.push({appkey: y.appkey});
                    y.checked = true;
                });
            });
        }

        $scope.selectAllFlag = !$scope.selectAllFlag;
    };

    $scope.addOtherParamToOwn = function () {
        if (angular.isUndefined($scope.otherAppkey || $scope.otherAppkey === "")) {
            app.toast.warning("请选择一个app！");
            return;
        }
        restAPI.app.get({
            ID: 'addOtherExtendParamToOwn',
            otherAppkey: $scope.otherAppkey,
            myAppkey: appkey,
            platform: app.store("platform")
        }, function (data) {
            if (angular.isDefined(data.data.info)) {
                app.toast.warning("该app没有扩展参数！");
            } else {
                //把没有的扩展参数添加进去
                angular.forEach(data.data, function (x) {
                    var flag = false;
                    angular.forEach($scope.myparams, function (y) {
                        if (x.key === y.key) {
                            flag = true;
                        }
                    });
                    if (!flag) {
                        $scope.myparams.push(x);
                    }
                });
                app.toast.info("复制成功！");
            }
        });
    };

    $scope.addParamToOtherApp = function (param) {

        if (angular.isUndefined(param.key) || param.key === "" || angular.isUndefined(param.key) || param.key === "") {
            alert("参数不能为空！");
            return;
        }

        // 如果新增，不能添加相同参数key
        if ($scope.isAddNewParam) {
            var flag = false;
            angular.forEach($scope.myparams, function (x) {
                if (x.key === param.key) {
                    flag = true;
                }
            });
            if (flag) {
                alert("不能添加相同的参数！");
                return;
            }
        }

        $scope.myapps.push({appkey: appkey});

        restAPI.app.save({
            ID: 'addAppExtendParamToOtherApp',
            OP: app.store("platform")
        }, {
            apps: $scope.myapps,
            param: param
        }, function () {
            $scope.myparams[editParamIndex] = param;
            if ($scope.isAddNewParam) {
                $scope.myparams.push(param);
                $scope.isAddNewParam = false;
            }
            app.toast.info("操作成功!")
        });
    };

    $scope.delParam = function (index) {
        var ap = $scope.myparams[index];
        app.confirmDialog({
            message: "您确定要删除此条数据吗？",
            name: "扩展参数:" + ap.key
        }, function () {
            var param = $scope.myparams[index];
            restAPI.app.save({
                ID: 'delExtendParam',
                appkey: appkey,
                platform: app.store("platform")
            }, param, function () {
                $scope.myparams.splice(index, 1);
                app.toast.info("操作成功!")
            });
        }, function () {

        });
    };
}]).controller("appAdStrategyCtrl", ["app", "$scope", "$window", function (app, $scope, $window) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    var restAPI = app.restAPI;
    // var adStrategyIdTmpl = "";
    // 是否开放部分广告权限(指是否删除广告策略中的click和delay,1代表打开,0代表关闭)
    var adPartAuth = app.store("user").adPartAuth;
    $scope.options = {
        mode: 'tree',
        modes: ['code', 'form', 'text', 'tree', 'view']
    };
    $scope.condition = {};
    $scope.pagination = {};
    $scope.condition.query = "";
    $scope.condition.linkid = "";
    $scope.adAuth = app.store("user").adAuth;
    $scope.ad = {};


    $scope.user = app.store('user');
    $scope.myapps = [];
    $scope.selectAllFlag = false;
    $scope.condition1 = {};
    $scope.condition1.query = "";
    var groups;

    // 获取用户所有应用分组
    restAPI.app.get({
        ID: 'getUserAllAppGroup',
        platform: app.store('platform')
    }, function (data) {
        groups = angular.copy(data.data);
        $scope.groups = data.data;
        angular.forEach($scope.groups, function (x) {
            x.apps = x.apps.filter(function (y) {
                return y.appkey !== appkey;
            });
        });
    });

    // 获取首页用户所有应用分组
    restAPI.app.get({
        ID: 'getUserAllLinkid',
        OP: app.store('platform')
    }, function (data) {
        $scope.linkids = data.data;
    });


    // 打开编辑model
    $scope.showModel = function (index) {
        $scope.errors = [];
        $scope.myapps = [];
        $scope.selectAllFlag = false;
        $scope.showParam = angular.copy($scope.params[index]);

        angular.forEach($scope.groups, function (x) {
            angular.forEach(x.apps, function (y) {
                y.checked = false;
            });
        });
    };

    //添加搜索监控
    $scope.$watch(function () {
        return $scope.condition1.query;
    }, function (newVal, oldVal) {
        //初始跳过
        if (newVal === oldVal) {
            return;
        }
        $scope.groups = angular.copy(groups);
        angular.forEach($scope.groups, function (x) {
            angular.forEach(x.apps, function (y) {
                y.checked = false;
                angular.forEach($scope.myapps, function (z) {
                    if (y.appkey === z.appkey) {
                        y.checked = true;
                    }
                });
            });
        });
        if ($scope.condition1.query !== "") {
            angular.forEach($scope.groups, function (x) {
                x.apps = x.apps.filter(function (y) {
                    return y.name.indexOf($scope.condition1.query) > -1;
                });
            });
        }
    });

    //缓存选中的app
    $scope.addToMyApp = function (app) {
        if (app.checked) {
            $scope.myapps = $scope.myapps.filter(function (x) {
                return x.appkey !== app.appkey;
            });
            app.checked = !app.checked;
        } else {
            app.checked = !app.checked;
            var flag = false;
            angular.forEach($scope.myapps, function (x) {
                if (x.appkey === app.appkey) {
                    flag = true;
                }
            });
            if (!flag) {
                $scope.myapps.push({appkey: app.appkey});
            }
        }
    };

    $scope.selectAll = function () {
        if ($scope.selectAllFlag) {
            $scope.myapps = [];
            angular.forEach($scope.groups, function (x) {
                angular.forEach(x.apps, function (y) {
                    y.checked = false;
                });
            });
        } else {
            $scope.myapps = [];
            angular.forEach($scope.groups, function (x) {
                angular.forEach(x.apps, function (y) {
                    y.checked = true;
                    $scope.myapps.push({appkey: y.appkey});
                });
            });
        }
        $scope.selectAllFlag = !$scope.selectAllFlag;
    };

    //获取用户所有app
    restAPI.app.save({
        ID: 'getUserAppInPage'
    }, {
        platform: app.store('platform')
    }, function (data) {
        $scope.apps = data.data.apps || [];
        $scope.pagination.pageSize = 15;
        $scope.pagination.totalRow = data.data.totalRow;
        $scope.pagination.pageNumber = 1;
    });

    if ($scope.user.adAuth === "0") {
        //获取广告策略
        restAPI.app.get({
            ID: 'getAdStrategy',
            OP: app.store("platform")
        }, function (data) {
            $scope.adStrategys = data.data;
        });
    }

    $scope.$watch("condition", function (newVal, oldVal) {
        if (newVal === oldVal) {
            return;
        }
        if ($scope.condition.linkid === null) {
            $scope.condition.linkid = "";
        }
        if ($scope.condition.mark === null) {
            $scope.condition.mark = "";
        }
        restAPI.app.save({
            ID: 'getUserAppInPage'
        }, {
            platform: app.store('platform'),
            query: $scope.condition.query,
            linkid: $scope.condition.linkid,
            mark: $scope.condition.mark
        }, function (data) {
            $scope.apps = data.data.apps;
            $scope.pagination.totalRow = data.data.totalRow;
            $scope.pagination.pageNumber = 1;
        });
    }, true);

    $scope.$on('genPagination', function (event, p) {
        if (event.stopPropagation)
            event.stopPropagation();
        if ($scope.condition.linkid === null) {
            $scope.condition.linkid = "";
        }
        if ($scope.condition.mark === null) {
            $scope.condition.mark = "";
        }
        restAPI.app.save({
            ID: 'getUserAppInPage'
        }, {
            platform: app.store('platform'),
            query: $scope.condition.query,
            linkid: $scope.condition.linkid,
            pageNumber: p,
            mark: $scope.condition.mark
        }, function (data) {
            $scope.apps = data.data.apps;
            $scope.pagination.totalRow = data.data.totalRow;
            $scope.pagination.pageNumber = p;
        });
    });

    $scope.showAdStrategyModal = function (ad, appkey, name, type) {
        $scope.adStrategyNodeType = type;
        if (type != null && type != '' && type != 'all') {
            $scope.nodeType = type;
        }
        $scope.ad = angular.extend(ad);
        //做容错处理，开放广告权限的时候，adStrategyId为custom
        if ($scope.adAuth === "0") {
            if ($scope.ad.adStrategyId === "custom") {
                angular.forEach($scope.adStrategys, function (x) {
                    if (x.default === "1") {
                        $scope.ad.adStrategyId = x._id.$oid;
                        $scope.ad.strategy = x.value;
                    }
                });
            } else {
                angular.forEach($scope.adStrategys, function (x) {
                    if (x._id.$oid === $scope.ad.adStrategyId) {
                        $scope.ad.strategy = x.value;
                    }
                });
            }
        } else if ($scope.adAuth === "1") {
            $scope.ad.adStrategyId = "custom";
        }

        if ($scope.ad.id === null || $scope.ad === undefined) {
            $scope.ad.id = {};
        }
        $scope.appkey = appkey;
        $scope.appname = name;
    };

    //变更广告策略
    $scope.updataAdStrategys = function (strategy) {
        //如果不是自定义的广告策略,要添加正确的公共广告策略内容
        if ($scope.adAuth === "0") {
            angular.forEach($scope.adStrategys, function (x) {
                if (x._id.$oid === $scope.ad.adStrategyId) {
                    $scope.ad.strategy = x.value;
                }
            });
        } else {
            $scope.ad.strategy = strategy;
            $scope.ad.adStrategyId = "custom";
        }

        // 检测要更新策略的JSON格式
        var failedCount = 0;
        angular.forEach($scope.ad.strategy, function (value, key) {
            if (angular.isArray(value)) {
                failedCount++;
            } else {
                angular.forEach(value, function (value1, key1) {
                    if (!angular.isArray(value1)) {
                        failedCount++;
                    }
                });
            }
        });
        if (failedCount != 0) {
            app.toast.error("广告策略的JSON格式不符合要求，请检查或参考其他广告策略格式");
            return;
        }

        restAPI.app.save({
            ID: 'updateAppAdStrategy',
            OP: $scope.appkey
        }, {
            nodeType: $scope.adStrategyNodeType,
            apps: $scope.myapps,
            value: $scope.ad.strategy,
            adStrategyId: $scope.ad.adStrategyId
        }, function () {
            angular.forEach($scope.apps, function (x) {
                if (x.appkey === $scope.appkey) {
                    x.ad = angular.extend($scope.ad);
                }
            });
            $("#adStrategyNodeModel").modal('hide');
            app.toast.success("更新成功！");
            $window.location.reload();
        });
    };

    //变更广告的id
    $scope.updataAdId = function (id) {
        restAPI.app.save({
            ID: 'updateAppAdId',
            OP: $scope.appkey
        }, {
            id: id
        }, function () {
            angular.forEach($scope.apps, function (x) {
                if (x.appkey === $scope.appkey) {
                    x.ad = angular.extend($scope.ad);
                }
            });
            $("#adId").modal('hide');

            app.toast.success("更新成功！");
        });
    };

    /**
     * by jiananzhao
     */
    $scope.anchor = 0;
    $scope.setAnchor = function (anchor) {
        $scope.anchor = anchor;
    };

    $scope.setNodeType = function (nodeType) {
        $scope.nodeType = nodeType;
    };

    $scope.nodeValue = null;
    $scope.appendAdStrategys = function () {
        if ($scope.nodeType == null) {
            window.alert('请选择一个节点类型');
            return;
        }
        if ($scope.nodeValue == null || $scope.nodeValue.length == 0) {
            window.alert('请输入节点的值');
            return;
        }
        try {
            console.log(angular.fromJson($scope.nodeValue));
        } catch (e) {
            window.alert('格式错误');
            return;
        }

        restAPI.app.save({
            ID: 'appendAdStrategys',
            OP: $scope.appkey
        }, {
            nodeType: $scope.nodeType,
            nodeValue: $scope.nodeValue,
            appKeys: $scope.myapps,
        }, function () {
            $("#adStrategyNodeModel").modal('hide');
            app.toast.success("更新成功！");
            window.location.reload();
        });
    };
}]).controller('adGroupEditCtrl', ['app', '$scope', '$stateParams', function (app, $scope, $stateParams) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }
    var restAPI = app.restAPI;
    var id = $stateParams.id;

    var options = {
        mode: 'tree',
        modes: ['code', 'form', 'text', 'tree', 'view']
    };
    $scope.options = options;

    //获取用户所有应用分组
    restAPI.app.get({
        ID: 'getUserAllAppGroupForAdGroup',
        platform: app.store('platform'),
        id: id
    }, function (data) {
        $scope.groups = data.data;

        if (angular.isUndefined(id) || id === null || id === "") {
            $scope.isAddNewAdGroup = true;
            $scope.adContent = {};
            $scope.adApps = [];
            $scope.name = "";
            checkApps();
        } else {
            $scope.isAddNewAdGroup = false;
            restAPI.app.get({
                ID: 'getAdGroupById',
                OP: id
            }, function (data) {
                $scope.adContent = data.data.adid;
                $scope.adApps = [];
                $scope.name = data.data.name;
                angular.forEach(data.data.apps, function (z) {
                    angular.forEach($scope.groups, function (x) {
                        angular.forEach(x.apps, function (y) {
                            if (z === y.appkey) {
                                $scope.adApps.push({name: y.name, appkey: y.appkey, linkid: x.linkid});
                            }
                        });
                    });
                });
                checkApps();
            });
        }
    });

    //筛选未被添加的应用
    function checkApps() {
        angular.forEach($scope.groups, function (x) {
            angular.forEach(x.apps, function (y) {
                y.checked = true;
                angular.forEach($scope.adApps, function (z) {
                    if (y.appkey === z.appkey) {
                        y.checked = false;
                    }
                });
            });
        });
        checkAppGroup();
    }

    //检测应用组中还有没有未添加的应用
    function checkAppGroup() {
        $scope.isGroupShow = false;
        angular.forEach($scope.groups, function (x) {
            x.linkidChecked = false;
            angular.forEach(x.apps, function (y) {
                if (y.checked) {
                    x.linkidChecked = true;
                    $scope.isGroupShow = true;
                }
            });
        });
    }

    //应用组全选
    $scope.selectAppGroup = function (linkid) {
        angular.forEach($scope.groups, function (x) {
            if (x.linkid === linkid) {
                angular.forEach(x.apps, function (y) {
                    if (y.checked) {
                        var app = {};
                        app.name = y.name;
                        app.appkey = y.appkey;
                        app.linkid = linkid;
                        $scope.adApps.push(app);
                        y.checked = false;
                    }
                });
            }
        });
        checkAppGroup();
    };

    //删除广告组里面的app
    $scope.delAppFromOwn = function (app) {
        angular.forEach($scope.groups, function (x) {
            if (x.linkid === app.linkid) {
                delete app.linkid;
                app.checked = true;
                x.apps.push(app);
                $scope.adApps = $scope.adApps.filter(function (x) {
                    return x.appkey !== app.appkey;
                });
            }
        });
        checkAppGroup();
    };

    //新增广告组里面的app
    $scope.addAppToOwn = function (app) {
        angular.forEach($scope.groups, function (x) {
            angular.forEach(x.apps, function (y) {
                if (app.appkey === y.appkey) {
                    var ap = {};
                    ap.name = app.name;
                    ap.appkey = app.appkey;
                    ap.linkid = x.linkid;
                    $scope.adApps.push(ap);
                    y.checked = false;
                }
            });
        });
        checkAppGroup();
    };

    //新增广告组
    $scope.addAdGroup = function () {
        //以后要添加广告的验证
        if (!angular.isObject($scope.adContent)) {
            app.toast.info("json格式不对!");
            return;
        }

        if (angular.isUndefined($scope.name) || $scope.name === null || $scope.name === "") {
            app.toast.info("请填写名称!");
            return;
        }

        restAPI.app.save({
            ID: 'addAdGroup',
            OP: app.store('platform')
        }, {
            adid: $scope.adContent,
            apps: $scope.adApps,
            name: $scope.name
        }, function () {
            app.toast.info("新增成功!");
            $('#adPolymer').modal('hide');
            app.$state.go("index.appAdPolymer");
        });
    };

    //更新广告组
    $scope.updateAdGroup = function () {
        //以后要添加广告的验证
        if (!angular.isObject($scope.adContent)) {
            app.toast.info("json格式不对!");
            return;
        }

        if (angular.isUndefined($scope.name) || $scope.name === null || $scope.name === "") {
            app.toast.info("请填写名称!");
            return;
        }

        restAPI.app.save({
            ID: 'updateAdGroup'
        }, {
            adid: $scope.adContent,
            apps: $scope.adApps,
            name: $scope.name,
            platform: app.store("platform"),
            id: id
        }, function () {
            $('#adPolymer').modal('hide');
            app.toast.info("更新成功!");
            app.$state.go("index.appAdPolymer");
        });
    };
}]).controller("taskInfoCtrl", ['app', '$scope', function (app, $scope) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    var restAPI = app.restAPI;
    var options = {
        mode: 'tree',
        modes: ['code', 'form', 'text', 'tree', 'view']
    };
    $scope.options = options;
    $scope.pagination = {};

    restAPI.task.get({
        ID: "query",
        platform: app.store('platform'),
        page: 1,
        pageSize: 30
    }, function (data) {
        $scope.tasks = data.data.tasks;
        $scope.pagination.pageSize = 30;
        $scope.pagination.totalRow = data.data.totalRow;
        $scope.pagination.pageNumber = 1;
    });

    $scope.$on('genPagination', function (event, p) {
        if (event.stopPropagation)
            event.stopPropagation();
        restAPI.task.get({
            ID: "query",
            platform: app.store('platform'),
            page: p,
            pageSize: 30
        }, function (data) {
            $scope.tasks = data.data.tasks;
            $scope.pagination.totalRow = data.data.totalRow;
            $scope.pagination.pageNumber = p;
        });
    });

    //删除任务
    $scope.delTask = function (optgroupid, index) {

        var task = $scope.tasks[index];
        app.confirmDialog({
            message: "您确定要删除此条数据吗？",
            name: "任务组描述:" + task.describe
        }, function () {
            restAPI.task.save({
                ID: 'delete',
                OP: optgroupid,
                platform: app.store('platform')
            }, {}, function (data) {
                if (data.data !== null) {
                    app.toast.info("删除失败!");
                } else {
                    $scope.tasks.splice(index, 1);
                    app.toast.info("删除成功!");
                }
            });
        }, function () {
        });
    };

    var _id;
    $scope.addProperty = function (task, index) {
        var property = angular.copy(task);
        _id = property._id.$oid;
        delete property.tasks, delete property.linkids, delete property.utime, delete property.pubid,
            delete property.platform, delete property.users, delete property._id
        $scope.property = property;
    };

    $scope.updateProperty = function () {
        if (!angular.isObject($scope.property)) {
            app.toast.error("格式有误，请检查！");
            return;
        }
        if (angular.isUndefined($scope.property.switch)) {
            app.toast.error("请填写switch节点！");
            return;
        }
        if ($scope.property.switch !== "1" && $scope.property.switch !== "0") {
            app.toast.error("switch节点只能为'0'或者'1'！");
            return;
        }
        if (angular.isUndefined($scope.property.describe)) {
            app.toast.error("请填写describe节点！");
            return;
        }

        restAPI.task.save({
            ID: "update",
            OP: _id,
            flag: "1"  //判断是修改属性还是任务
        }, $scope.property, function (data) {
            $("#addProperty").modal('hide');
            app.toast.info("更新成功！");
            app.timeout(function () {
                window.location.reload(true);
            }, 500);
        }, function () {
        });

    };
}]).controller("taskInsertCtrl", ['app', '$scope', function (app, $scope) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    var restAPI = app.restAPI;
    var user = app.store("user");
    var jsonData,
        options = {
            mode: 'tree',
            modes: ['code', 'form', 'text', 'tree', 'view']
        };

    $scope.options = options;
    $scope.errors = [];

    $scope.callback = function (file) {
        jsonData = JSON.parse(file.content);
        $scope.jsonfile = file;
        $scope.data = jsonData;
        $scope.isJson = ($scope.jsonfile.name.split('.')[1] === 'json');
    };

    $scope.submit = function () {

        $scope.errors = [];

        //var data = $scope.data;
        /*if (!angular.isArray($scope.data)) {
            data = []
            data.push($scope.data);
        } else {
            data = $scope.data;
        }*/
        //校验json，如果json格式有误，$scope.data为空对象
        var flag = true;
        var taskData = $scope.data;
        angular.forEach(taskData, function () {
            flag = false;
        });
        if (flag) {
            $scope.errors.push({"error": "json为空或json格式有误！请检查后重新上传json文件！"});
            return;
        }
        if (angular.isUndefined($scope.data.describe)) {
            $scope.errors.push({"error": "请添加描述describe！"});
            return;
        }
        if (angular.isUndefined($scope.data.tasks)) {
            $scope.errors.push({"error": "请添加tasks节点！"});
            return;
        }
        if (angular.isUndefined($scope.data.switch)) {
            $scope.errors.push({"error": "请添加switch节点！"});
            return;
        }
        if ($scope.data.switch !== "1" && $scope.data.switch !== "0") {
            $scope.errors.push({"error": "switch节点只能为'0'或者'1'"});
            return;
        }
        if (!angular.isArray($scope.data.tasks)) {
            $scope.errors.push({"error": "tasks节点必须是数组！"});
            return;
        }

        var data = $scope.data.tasks;

        // 校验权重大小
        var weighFlag = true;
        var id_flag = true;
        var time_flag = true;
        angular.forEach(data, function (x) {
            var weight = x.weight;
            if (!app.checkWeightData(weight, 10000)) {
                weighFlag = false;
            }
            var id = x.id;
            if (!angular.isString(id)) {
                id_flag = false;
            }
            var time = x.taskSaveTime;
            if (!angular.isString(time)) {
                time_flag = false;
            }
        });
        if (!weighFlag) {
            $scope.errors.push({"error": "请将权重weight设置在-1和10000之间！"});
            return;
        }

        if (!id_flag) {
            app.toast.error("task节点id必须为字符串！");
            return;
        }
        if (!time_flag) {
            app.toast.error("task节点taskSaveTime必须为字符串！");
            return;
        }

        var property = angular.copy($scope.data);
        restAPI.task.save({
            ID: "create",
            platform: app.store("platform"),
            describe: $scope.data.describe
        }, property, function (data) {
            if (data.data !== null) {
                $scope.errors = data.data;
            } else {
                app.toast.info("上传成功!");
                app.timeout(function () {
                    if (user.pub_level === "1") {
                        app.$state.go("task.taskInfo");
                    } else {
                        app.$state.go("sadminTask.sadminTaskInfo");
                    }
                }, 1000);
            }
        });
    };

}]).controller("taskModifyCtrl", ['app', '$scope', '$stateParams', function (app, $scope, $stateParams) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    var restAPI = app.restAPI,
        optgroupid = $stateParams.optgroupid

    var jsonData = {},
        options = {
            mode: 'tree',
            modes: ['code', 'form', 'text', 'tree', 'view']
        };

    $scope.options = options;
    $scope.errors = [];


    var task = [];

    restAPI.task.get({
        ID: "queryById",
        OP: optgroupid
    }, function (data) {
        if (data.data !== null) {
            $scope.task = data.data.tasks;
            task = angular.copy(data.data.tasks);
            var linkids = data.data.linkids;
            //获取所有的应用组
            restAPI.app.get({
                ID: 'getUserAllLinkid',
                OP: app.store('platform')
            }, function (linkiddata) {
                $scope.linkids = linkiddata.data;
                angular.forEach($scope.linkids, function (x) {
                    x.checked = false;
                    angular.forEach(linkids, function (y) {
                        if (x.linkid === y) {
                            x.checked = true;
                        }
                    });
                });
            });
        } else {
            app.toast.error("数据异常!请联系管理员！");
        }
    });

    $scope.delTask = function (t, index) {
        app.confirmDialog({
            message: "您确定要删除此条数据吗？",
            name: "任务名称:" + t.name
        }, function () {
            task.splice(index, 1);
            var myLinkids = [];
            angular.forEach($scope.linkids, function (x) {
                if (x.checked) {
                    myLinkids.push(x.linkid);
                }
            });
            restAPI.task.save({
                ID: "update",
                OP: optgroupid,
                linkids: myLinkids,
                action: "0",   // action是编辑节点任务标志，1是新增，0是删除
                taskId: t.id  // 增加taskID请求参数，区分是删除任务
            }, task, function (data) {
                if (data.data !== null) {
                    $scope.errors = data.data;
                } else {
                    $scope.task.splice(index, 1);
                    app.toast.info("删除成功!");
                }
            }, function () {
            });
        }, function () {
        });
    };

    var taskIndex;
    var id;
    $scope.modifyTask = function (data, index) {
        $scope.subtask = data;
        taskIndex = index;
        id = data.id
    };

    $scope.updateTask = function () {
        if (angular.isArray($scope.subtask)) {
            app.toast.error("保存失败！请填写单个任务节点对象");
        } else {
            var myLinkids = [];
            angular.forEach($scope.linkids, function (x) {
                if (x.checked) {
                    myLinkids.push(x.linkid);
                }
            });
            // 校验权重大小
            var weight = $scope.subtask.weight;
            if (!app.checkWeightData(weight, 10000)) {
                app.toast.error("请将权重weight设置在-1和10000之间！");
                return;
            }
            if (id !== $scope.subtask.id) {
                app.toast.error("任务ID不能更改！");
                return;
            }
            if (!angular.isString($scope.subtask.id)) {
                app.toast.error("task节点id必须为字符串！");
                return;
            }
            if (!angular.isString($scope.subtask.taskSaveTime)) {
                app.toast.error("task节点taskSaveTime必须为字符串！");
                return;
            }
            task[taskIndex] = $scope.subtask;
            restAPI.task.save({
                ID: "update",
                OP: optgroupid,
                linkids: myLinkids
            }, task, function (data) {
                if (data.data !== null) {
                    $scope.errors = data.data;
                } else {
                    $scope.task[taskIndex] = $scope.subtask;
                    app.toast.info("更新成功!");
                }
            }, function () {
            });
        }
        $("#taskModify").modal('hide');
    };

    $scope.addTask = function () {
        var subTaskData = angular.copy($scope.subtaskdata);
        if (angular.isArray(subTaskData)) {
            app.toast.error("保存失败！请填写单个任务节点对象");
        } else {
            var myLinkids = [];
            angular.forEach($scope.linkids, function (x) {
                if (x.checked) {
                    myLinkids.push(x.linkid);
                }
            });
            // 校验权重大小
            var weight = subTaskData.weight;
            if (!app.checkWeightData(weight, 10000)) {
                //$scope.errors.push({"error": "请将权重weight设置在-1和10000之间！"});
                app.toast.error("请将权重weight设置在-1和10000之间！");
                return;
            }

            if (angular.isUndefined(subTaskData.id)) {
                app.toast.error("请增加task节点id！");
                return;
            }
            if (!angular.isString(subTaskData.id)) {
                app.toast.error("task节点id必须为字符串！");
                return;
            }
            if (!angular.isString(subTaskData.taskSaveTime)) {
                app.toast.error("task节点taskSaveTime必须为字符串！");
                return;
            }
            task.push(subTaskData);
            restAPI.task.save({
                ID: "update",
                OP: optgroupid,
                linkids: myLinkids,
                action: "1",   // action是编辑节点任务标志，1是新增，0是删除
                taskId: subTaskData.id  // 增加taskID请求参数，区分是新增任务，以便后端判断任务ID重复性
            }, task, function (data) {
                if (data.data !== null) {
                    task.pop();
                    app.toast.error("新增任务的图片不存在，请检查!");
                } else {
                    $scope.task.push(subTaskData);
                    app.toast.info("新增成功!");
                    $scope.subtaskdata = {};
                }
                $("#addTask").modal('hide');
            }, function () {
                task.pop();
            });
        }
    };

    //选择应用组
    $scope.selectLinkid = function (index) {
        if ($scope.linkids[index].checked) {
            $scope.linkids[index].checked = false;
        } else {
            $scope.linkids[index].checked = true;
        }
    };

    $scope.submit = function () {
        $scope.errors = [];
        var myLinkids = [];

        angular.forEach($scope.linkids, function (x) {
            if (x.checked) {
                myLinkids.push(x.linkid);
            }
        });

        //只获取数据中task节点数组
        //var taskarr = $scope.task;
        //console.log("task数据为："+angular.toJson(task));

        // 校验权重大小
        var weighFlag = true;
        angular.forEach(task, function (x) {
            var weight = x.weight;
            if (!app.checkWeightData(weight, 10000)) {
                weighFlag = false;
            }
        });
        if (!weighFlag) {
            $scope.errors.push({"error": "请将权重weight设置在-1和10000之间！"});
            return;
        }

        restAPI.task.save({
            ID: "update",
            OP: optgroupid,
            linkids: myLinkids
        }, task, function (data) {
            if (data.data !== null) {
                $scope.errors = data.data;
            } else {
                app.toast.info("保存成功!");
                app.timeout(function () {
                    app.$state.go("task.taskInfo");
                }, 1000);
            }
        }, function () {
        });
    }
}]).controller("sadminTaskModifyCtrl", ['app', '$scope', '$stateParams', function (app, $scope, $stateParams) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    var restAPI = app.restAPI,
        optgroupid = $stateParams.optgroupid,
        userdata;

    //检测是否为超管
    if (app.store("user").pub_level === "1") {
        app.rootScope.goBack();
        return;
    }

    var jsonData = {},
        options = {
            mode: 'tree',
            modes: ['code', 'form', 'text', 'tree', 'view']
        };

    $scope.options = options;
    $scope.errors = [];
    $scope.myusers = [];

    //获取用户信息
    restAPI.sadmin.get({
        ID: 'getAllUserInfoGroupByCompanyName'
    }, function (data) {
        userdata = data.data;
        angular.forEach(userdata, function (x) {
            x.showName = x.company_name + "-" + x.contacts;
        });
        $scope.users = angular.copy(userdata);
    });

    restAPI.task.get({
        ID: "queryById",
        OP: optgroupid
    }, function (data) {
        if (data.data !== null) {
            $scope.task = data.data.tasks;
            $scope.myusers = [];
            $scope.users = $scope.users.filter(function (x) {
                var flag = true;
                angular.forEach(data.data.users, function (y) {
                    if (x.pubid === y) {
                        $scope.myusers.push(x);
                        flag = false;
                    }
                });
                return flag;
            });
        } else {
            app.toast.error("数据异常!请联系管理员！");
        }
    });

    //添加用户
    $scope.addUser = function (index) {
        var user = $scope.users[index];
        $scope.myusers.push(user);
        $scope.users.splice(index, 1);
    };

    //移除用户
    $scope.delUser = function (index) {
        var user = $scope.myusers[index];
        $scope.myusers.splice(index, 1);
        $scope.users.push(user);
    };

    $scope.submit = function () {
        $scope.errors = [];
        var myusers = [];

        if ($scope.myusers.length > 0) {
            angular.forEach($scope.myusers, function (x) {
                myusers.push(x.pubid);
            });
        }

        //只获取数据中task节点数组
        //var taskarr = $scope.task.tasks;
        restAPI.task.save({
            ID: "update",
            OP: optgroupid,
            users: myusers
        }, $scope.task, function (data) {
            if (data.data !== null) {
                app.toast.error("保存失败!");
            } else {
                app.toast.info("保存成功!");
                app.timeout(function () {
                    app.$state.go("sadminTask.sadminTaskInfo");
                }, 1000);
            }
        }, function () {
        });
    }

}]).controller("strategyInfoCtrl", ['app', '$scope', function (app, $scope) {

    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    var restAPI = app.restAPI;
    $scope.list = [];
    $scope.upload = false;
    $scope.query = "";
    $scope.pagination = {};
    $scope.showCampaign = {};

    restAPI.campaign.get({
        ID: "getUserAllCampaign",
        OP: app.store("platform")
    }, function (data) {
        $scope.campaigns = data.data.slice(0, 15) || [];
        $scope.pagination.pageSize = 15;
        $scope.pagination.totalRow = data.data.length;
        $scope.pagination.pageNumber = 1;
    });

    $scope.$watch("query", function (newVal, oldVal) {
        if (newVal === oldVal) {
            return;
        }
        if ($scope.query === null) {
            $scope.query = "";
        }
        restAPI.campaign.get({
            ID: 'getUserAllCampaignInCondition',
            platform: app.store('platform'),
            query: $scope.query
        }, function (data) {
            $scope.campaigns = data.data.slice(0, 15);
            $scope.pagination.totalRow = data.data.length;
            $scope.pagination.pageNumber = 1;
        });
    });

    $scope.$on('genPagination', function (event, p, s) {
        if (event.stopPropagation)
            event.stopPropagation();
        if ($scope.query === null) {
            $scope.query = "";
        }
        restAPI.campaign.get({
            ID: 'getUserAllCampaignInCondition',
            platform: app.store('platform'),
            query: $scope.query
        }, function (data) {
            $scope.apps = data.data.slice(15 * (p - 1), 15 * p);
            $scope.pagination.totalRow = data.data.length;
            $scope.pagination.pageNumber = p;
        });
    });

    $scope.updateSynInfo = function () {
        restAPI.sys.get({
            ID: 'strategySynInfo',
            OP: app.store('platform')
        }, function (data) {
            $scope.list = [];
            if (data.data.success) {
                $scope.list = data.data.info;
            } else {
                $scope.list.push({info: '发布中'});
                app.timeout(function () {
                    $scope.updateSynInfo();
                }, 30 * 1000);
            }
        });
    };

    $scope.showModal = function () {
        $scope.errors = [];
    };

    $scope.showCampaignPkgname = function (apps, subgroup) {
        $scope.showCampaign.apps = apps;
        $scope.showCampaign.subgroup = subgroup;
    };

    //发布投放信息
    $scope.syn = function () {

        $scope.errors = [];
        $scope.errorShow = false;

        $scope.reason = $scope.reason.trim();
        if ($scope.reason.length < 5) {

            $scope.errorShow = true;
            $scope.errors.push({error: "发布原因描述不能少于10个字符"});
            return;
        }

        restAPI.sys.get({
            ID: 'strategySyn',
            platform: app.store("platform"),
            reason: $scope.reason
        }, function (data) {
            if (data.data.result) {
                $scope.upload = true;
                $('#strategySyn').modal('hide');
                $scope.list.push({info: '发布中'});
                app.timeout($scope.updateSynInfo(), 4 * 1000);
            } else {
                app.toast.info("发布失败！");
            }
        });
    };

    //刷新同步信息
    $scope.newSynInfo = function () {
        restAPI.sys.get({
            ID: 'strategySynInfo',
            OP: app.store('platform')
        }, function (data) {
            $scope.list = [];
            if (data.data.success) {
                $scope.list = data.data.info;
            } else {
                $scope.list.push({info: '发布中'});
            }
        });
    };

    //删除投放信息
    $scope.delCampaign = function (optgroupid, index) {

        var ap = $scope.campaigns[index];
        app.confirmDialog({
            message: "您确定要删除此条数据吗？",
            name: "投放策略:" + ap.subgroup
        }, function () {
            restAPI.campaign.save({
                ID: 'delCampaign',
                optgroupid: optgroupid,
                platform: app.store("platform")
            }, {}, function () {
                $scope.campaigns.splice(index, 1);
                app.toast.info("删除成功！");
            });

        }, function () {

        });
    };
}]).controller("strategyInsertCtrl", ['app', '$scope', function (app, $scope) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    var restAPI = app.restAPI;
    var user = app.store("user");
    var jsonData = {},
        options = {
            mode: 'tree',
            modes: ['code', 'form', 'text', 'tree', 'view']
        };
    var isAbleSubAccountAddStrategy = true;

    $scope.data = jsonData;
    $scope.options = options;
    $scope.errors = [];

    $scope.callback = function (file) {
        jsonData = JSON.parse(file.content);
        $scope.jsonfile = file;
        $scope.data = jsonData;
        $scope.isJson = ($scope.jsonfile.name.split('.')[1] === 'json');
    };

    //获取所有linkid
    restAPI.sadmin.get({
        ID: 'getUserAllAppLinkidForAdmin',
        OP: app.store("platform")
    }, function (data) {
        $scope.linkids = data.data;
    });

    //获取所有subgroup
    restAPI.campaign.get({
        ID: 'getUserAllCampaignSubgroup',
        OP: app.store("platform")
    }, function (data) {
        $scope.subgroups = data.data;
    });

    if ($scope.isSubAccount) {
        //如果是子账户,获取子账户的应用组权限
        restAPI.app.get({
            ID: 'getUserAllLinkid',
            OP: app.store('platform')
        }, function (data) {
            $scope.myLinkids = data.data;
        });

        //标识子账户还能不能添加新的投放策略,因为一个应用组对应一个策略,若是子账户权限内的应用组都有了投放策略,也就不能添加新的投放策略了
        angular.forEach($scope.myLinkids, function (x) {
            var flag = false;
            angular.forEach($scope.subgroups, function (y) {
                if (x.linkid === y.linkid) {
                    flag = true;
                }
            });
            if (!flag) {
                isAbleSubAccountAddStrategy = false;
            }
        });
    }

    $scope.submit = function () {
        if ($scope.isSubAccount && isAbleSubAccountAddStrategy) {
            $scope.errors.push({"error": "账户权限内的所有应用组都已经配置了投放策略,不能添加新的投放策略,请在查看里面策略里面编辑！"});
            return;
        }

        var isStrategyTrue = true;
        $scope.errors = [];
        //校验json，如果json格式有误，$scope.data为空对象
        var flag = true;
        angular.forEach($scope.data, function () {
            flag = false;
        });
        if (flag) {
            $scope.errors.push({"error": "json为空或json格式有误！请检查后重新上传json文件！"});
            return;
        }

        var data;
        if (!angular.isArray($scope.data)) {
            data = [];
            data.push($scope.data);
        } else {
            data = $scope.data;
        }

        // 校验投放策略权重大小范围
        var weighFlag1 = true;
        angular.forEach(data, function (x) {
            var weight = x.weight;
            if (!app.checkWeightData(weight, 500)) {
                weighFlag1 = false;
            }
        });
        if (!weighFlag1) {
            $scope.errors.push({"error": "请将投放策略的权重weight设置在-1和500之间！"});
            return;
        }

        // 校验投放推广策略权重大小
        var weighFlag2 = true;
        angular.forEach(data, function (x) {
            var campaign = x.campaign;
            angular.forEach(campaign, function (z) {
                var contents = z.contents;
                angular.forEach(contents, function (y) {
                    var weight = y.weight;
                    if (!app.checkWeightData(weight, 5000)) {
                        weighFlag2 = false;
                    }
                });
            });
        });
        if (!weighFlag2) {
            $scope.errors.push({"error": "请将campaign节点中的contents投放推广策略weight设置在-1和5000之间！"});
            return;
        }

        //对必须有的字段进行校验
        angular.forEach(data, function (x, m) {
            if (angular.isUndefined(x.subgroup) || x.subgroup === "") {
                $scope.errors.push({"error": "请为第" + m + "个Strategy填写subgroup字段！"});
                isStrategyTrue = false;
            }
            // if(angular.isUndefined(x.linkid) || x.linkid === ""){
            //     $scope.errors.push({"error":"请为第" + m + "个Strategy填写linkid字段！"});
            //     isStrategyTrue = false;
            // }
            if (angular.isUndefined(x.apps) || x.apps === "") {
                $scope.errors.push({"error": "请为第" + m + "个Strategy填写apps字段！"});
                isStrategyTrue = false;
            }
            if (angular.isUndefined(x.campaign) || x.campaign === "") {
                $scope.errors.push({"error": "请为第" + m + "个Strategy填写campaign字段！"});
                isStrategyTrue = false;
            }
            // if(angular.isUndefined(x.pub_account) || x.pub_account === ""){
            //     $scope.errors.push({"error":"请为第" + m + "个Strategy填写pub_account字段！"});
            //     isStrategyTrue = false;
            // }

            //检验linkid是否存在,超管不用检查
            // if (user.pub_level === "1"){
            //     var flag = false;
            //     angular.forEach($scope.linkids, function (y) {
            //         if(x.linkid === y.linkid){
            //             flag = true;
            //         }
            //     });
            //     if(!flag){
            //         $scope.errors.push({"error":"第" + m + "个Strategy中的linkid不存在,请检查！"});
            //         isStrategyTrue = false;
            //     }else {
            //         //检测子账户的应用组权限
            //         if ($scope.isSubAccount){
            //             angular.forEach($scope.myLinkids, function (y) {
            //                 if (x.linkid === y.linkid){
            //                     $scope.errors.push({"error":"第" + m + "个Strategy中的linkid不存在,请检查！"});
            //                     isStrategyTrue = false;
            //                 }
            //             })
            //         }
            //     }
            // }

            //检验subgroup是否重复
            var flag1 = false;
            angular.forEach($scope.subgroups, function (y) {
                if (x.subgroup === y.subgroup) {
                    flag1 = true;
                }
            });
            if (flag1) {
                $scope.errors.push({"error": "第" + m + "个Strategy中的subgroup字段已存在,请修改!"});
                isStrategyTrue = false;
            }
        });

        if (!isStrategyTrue) {
            return;
        }

        //添加campaignid
        if (user.pub_level === "0") {
            angular.forEach(data, function (x) {
                if (angular.isUndefined(x.campaignid)) {
                    x.campaignid = user.pubid;
                }
            });
        } else {
            angular.forEach(data, function (x) {
                x.campaignid = user.pubid;
            });
        }


        restAPI.campaign.save({
            ID: "addCampaign",
            OP: app.store("platform")
        }, data, function (data) {
            if (data.data !== null) {
                $scope.errors = data.data;
            } else {
                if (user.pub_level === "1") {
                    app.$state.go("strategy.strategyInfo");
                } else {
                    app.$state.go("sadminStrategy.sadminStrategyInfo");
                }
            }
        });
    };
}]).controller("strategyModifyCtrl", ['app', '$scope', '$stateParams', function (app, $scope, $stateParams) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    var restAPI = app.restAPI,
        optgroupid = $stateParams.optgroupid,
        oldCampaignName;

    var jsonData = {},
        options = {
            mode: 'tree',
            modes: ['code', 'form', 'text', 'tree', 'view']
        };

    $scope.options = options;
    $scope.errors = [];
    $scope.myLinkids = [];
    var user = app.store("user");

    //获取所有的投放策略
    restAPI.campaign.get({
        ID: "getCampaignByGroupId",
        OP: optgroupid
    }, function (data) {
        $scope.campaign = data.data;
        var linkids = angular.copy($scope.campaign.linkids);
        // delete $scope.campaign.linkids;  不能删除linkids
        // angular.forEach($scope.campaign.apps, function (x) {
        //     if (x.icon !== undefined){
        //         x.icon = x.icon.replace("_" + user.pubid, "");
        //     }
        //
        //     angular.forEach(x.img, function (y) {
        //         if (y.imgurl !== undefined){
        //             y.imgurl = y.imgurl.replace("_" + user.pubid, "");
        //         }
        //     });
        // });

        //获取所有的应用组
        restAPI.app.get({
            ID: 'getUserAllLinkid',
            OP: app.store('platform')
        }, function (data) {
            $scope.linkids = data.data;
            angular.forEach($scope.linkids, function (x) {
                x.checked = false;
                angular.forEach(linkids, function (y) {
                    if (x.linkid === y) {
                        x.checked = true;
                    }
                });
            });
        });
        oldCampaignName = $scope.campaign.subgroup;
    });

    //选择应用组
    $scope.selectLinkid = function (index) {
        if ($scope.linkids[index].checked) {
            $scope.linkids[index].checked = false;
        } else {
            $scope.linkids[index].checked = true;
        }
    };

    $scope.submit = function () {
        $scope.errors = [];
        var isAppTrue = true;
        var myLinkids = [];

        if (angular.isUndefined($scope.campaign.apps)) {
            $scope.errors.push({"error": "apps字段不能删除！请刷新后重新编辑！"});
            isAppTrue = false;
        }
        if (angular.isUndefined($scope.campaign.campaign)) {
            $scope.errors.push({"error": "campaign字段不能删除！请刷新后重新编辑！"});
            isAppTrue = false;
        }
        if (angular.isUndefined($scope.campaign.subgroup)) {
            $scope.errors.push({"error": "subgroup字段不能删除！请刷新后重新编辑！"});
            isAppTrue = false;
        }

        //如果是超管，campaignid字段可以暴露出来，但是不能删除
        if (user.pub_level === "0" && angular.isUndefined($scope.campaign.campaignid)) {
            $scope.errors.push({"error": "campaignid字段不能删除！请刷新后重新编辑！"});
            isAppTrue = false;
        }

        //campaign数组里面每个对象里面的page字符串数组不能为空
        angular.forEach($scope.campaign.campaign, function (x, m) {
            if (angular.isUndefined(x.page)) {
                $scope.errors.push({"error": "campaign对象数组中第" + (m + 1) + "个对象中的page节点不存在,请修改!"});
                isAppTrue = false;
            } else if (!(x.page instanceof Array)) {
                $scope.errors.push({"error": "campaign对象数组中第" + (m + 1) + "个对象中的的page节点格式错误,请修改String数组!"});
                isAppTrue = false;
            } else if (x.page.length === 0) {
                $scope.errors.push({"error": "campaign对象数组中第" + (m + 1) + "个对象中的的page节点的数组长度为零,请修改!"});
                isAppTrue = false;
            } else {
                angular.forEach(x.page, function (y, n) {
                    if (y === "") {
                        $scope.errors.push({"error": "campaign对象数组中第" + (m + 1) + "个对象中的的page节点中的第" + (n + 1) + "个节点为空,请修改!"});
                        isAppTrue = false;
                    }
                });
            }
        });

        // 校验投放推广策略权重大小
        var weighFlag = true;
        angular.forEach($scope.campaign.campaign, function (x) {
            var contents = x.contents;
            angular.forEach(contents, function (y) {
                var weight = y.weight;
                if (!app.checkWeightData(weight, 5000)) {
                    weighFlag = false;
                }
            });
        });
        if (!weighFlag) {
            $scope.errors.push({"error": "请将campaign节点中的contents投放推广策略weight设置在-1和5000之间！"});
            return;
        }

        // 校验投放策略权重大小
        var weight = $scope.campaign.weight;
        if (!app.checkWeightData(weight, 500)) {
            app.toast.error("请将投放策略的权重weight设置在-1和500之间！");
            return;
        }

        //如果是普通管理员,加上默认的campaignid
        if (user.pub_level === "1") {
            $scope.campaign.campaignid = user.pubid;
        }

        if (!isAppTrue) {
            return;
        }

        //如果是普通管理员,加上默认的campaignid
        if (user.pub_level === "1") {
            $scope.campaign.campaignid = user.pubid;
        }

        angular.forEach($scope.linkids, function (x) {
            if (x.checked) {
                myLinkids.push(x.linkid);
            }
        });

        restAPI.campaign.save({
            ID: "updateCampaignByOptGroup",
            platform: app.store("platform")
        }, {
            optgroupid: optgroupid,
            linkids: myLinkids,
            campaign: $scope.campaign,
            oldCampaignName: oldCampaignName
        }, function (data) {
            if (data.data !== null) {
                $scope.errors = data.data;
                delete $scope.campaign.campaignid;
            } else {
                if (user.pub_level === "1") {
                    app.$state.go("strategy.strategyInfo");
                } else {
                    app.$state.go("sadminStrategy.sadminStrategyInfo");
                }
            }
        }, function () {
            delete $scope.campaign.campaignid;
        });
    };
}]).controller("appAndCampaignSynCtrl", ['app', '$scope', '$timeout', function (app, $scope, $timeout) {

    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }
    var restAPI = app.restAPI,
        user = app.store("user");

    $scope.myapps = [];
    $scope.list = [];
    $scope.pubType = "1";
    $scope.isSelectLinkid = false;
    $scope.reason = "";
    $scope.pagination = {};
    $scope.search = {linkid: "", mark: ""};

    //获取所有APP
    restAPI.pub.get({
        ID: 'getUserAllPubApp',
        OP: app.store('platform')
    }, function (data) {

        $scope.data = app.union(data.data);
        $scope.apps = app.union(data.data);
        $scope.appList = $scope.apps.slice(0, 15);
        angular.forEach($scope.apps, function (x) {
            x.isSelect = false;
        });
        $scope.pagination.totalRow = $scope.apps.length;
        $scope.pagination.pageSize = 15;
        $scope.pagination.pageNumber = 1;
    });

    //获取用户所有应用分组
    restAPI.pub.get({
        ID: 'getUserPubLinkid',
        OP: app.store('platform')
    }, function (data) {
        $scope.linkids = data.data;
    });

    //监控linkid变化
    $scope.$watch(function () {
        return $scope.search;
    }, function (newVal, oldVal) {
        if (newVal === oldVal) {
            return;
        }
        if ($scope.search.mark === "" && ($scope.search.linkid === "" || $scope.search.linkid == null)) {
            $scope.apps = app.union($scope.data);
        } else if ($scope.search.mark === "") {
            $scope.apps = $scope.data.filter(function (x) {
                return x.linkid === $scope.search.linkid;
            });
        } else if ($scope.search.linkid === "" || $scope.search.linkid == null) {
            $scope.apps = $scope.data.filter(function (x) {
                return x.mark === $scope.search.mark;
            });
        } else {
            $scope.apps = $scope.data.filter(function (x) {
                return x.linkid === $scope.search.linkid && x.mark === $scope.search.mark;
            });
        }

        $scope.appList = $scope.apps.slice(0, 15);
        $scope.pagination.totalRow = $scope.apps.length;
        $scope.pagination.pageNumber = 1;

        angular.forEach($scope.apps, function (x) {
            x.isSelect = false;
        });
        $scope.isSelectLinkid = false;
    }, true);

    //监控分页变化
    $scope.$on('genPagination', function (event, p) {
        if (event.stopPropagation)
            event.stopPropagation();

        $scope.appList = $scope.apps.slice(15 * (p - 1), 15 * p);
        $scope.pagination.pageNumber = p;
    });

    //选择分组内所有app,若是所有分组,则选中所有app
    $scope.selectLinkid = function () {
        $scope.myapps = [];
        if ($scope.isSelectLinkid) {
            angular.forEach($scope.apps, function (x) {
                x.isSelect = false;
            });
        } else {
            angular.forEach($scope.apps, function (x) {
                $scope.myapps.push(x);
                x.isSelect = true;
            });
        }
        $scope.isSelectLinkid = !$scope.isSelectLinkid;
    };

    $scope.selectApp = function (index) {
        var app = $scope.appList[index];
        if (app.isSelect) {
            $scope.myapps = $scope.myapps.filter(function (x) {
                return x.appkey !== app.appkey;
            });
        } else {
            $scope.myapps.push(app);
        }
        app.isSelect = !app.isSelect;
    };

    $scope.showModal = function () {
        $scope.errors = [];
    };

    //通知cdn更新
    $scope.syn = function () {
        $scope.errors = [];
        $scope.errorShow = false;
        if ($scope.myapps.length === 0) {
            $scope.errorShow = true;
            $scope.errors.push({error: "请选择app！"});
            return;
        }

        $scope.reason = $scope.reason.trim();
        if ($scope.reason.length < 5) {

            $scope.errorShow = true;
            $scope.errors.push({error: "发布原因描述不能少于10个字符"});
            return;
        }

        // if($scope.myapps.length === $scope.data.length){
        //     $scope.pubType = "2";
        // }

        var appkeys = "";
        angular.forEach($scope.myapps, function (x) {
            appkeys = appkeys + x.appkey + ",";
        });

        appkeys = appkeys.substring(0, appkeys.lastIndexOf(","));

        var data = {platform: app.store("platform"), pubType: $scope.pubType, appkeys: appkeys, reason: $scope.reason};
        $('#appSyn').modal('hide');
        restAPI.sys.save({
            ID: 'publish'
        }, data, function (data) {
            if (data.data.msg.name === "success") {
                app.store("pubAppkeys", appkeys);
                app.toast.info(data.data.msg.message + "2秒后自动跳转到发布查询");
                $timeout(function () {
                    app.$state.go("appAndCampaignSyn.synStatusLog");
                }, 2 * 1000);
            } else {
                app.toast.info(data.data.msg.message);
            }
        });
    };
}]).controller('appAndCampaignLogCtrl', ['app', '$scope', function (app, $scope) {

    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    var restAPI = app.restAPI;
    var notFinishedLog = [];
    var finishedLog = [];

    $scope.pagination = {};
    $scope.condition = {search: "", stime: "", etime: ""};
    $scope.searchh = {mark: ""};
    //获取所有的发布状态记录，默认为1天之内的纪录
    restAPI.pub.save({
        ID: 'getSynStatusLogInPage'
    }, {
        platform: app.store('platform')
    }, function (data) {
        $scope.list = data.data.logs || [];
        $scope.pagination.pageSize = 15;
        $scope.pagination.totalRow = data.data.totalRow;
        $scope.pagination.pageNumber = 1;
        finishedLog.splice(0, finishedLog.length);
        notFinishedLog.splice(0, notFinishedLog.length);
        angular.forEach($scope.list, function (x) {
            if (x.status === "1") {
                finishedLog.push(x);
            } else if (x.status === "2") {
                notFinishedLog.push(x);
            }
        });
    });

    //日期搜索
    $('#reservation').daterangepicker(
        {
            timePicker: true,
            timePicker24Hour: true,
            timePickerSeconds: true
        }, function (start, end, label) {
            $scope.$apply(function () {
                var startDate = new Date(start);
                $scope.condition.stime = startDate.getFullYear() + "-" + (startDate.getMonth() + 1) + "-" + startDate.getDate() + " " +
                    startDate.getHours() + ":" + startDate.getMinutes() + ":" + startDate.getSeconds();
                var endDate = new Date(end);
                $scope.condition.etime = endDate.getFullYear() + "-" + (endDate.getMonth() + 1) + "-" + endDate.getDate() + " " +
                    endDate.getHours() + ":" + endDate.getMinutes() + ":" + endDate.getSeconds();
            });
        });

    //按照APP名称获取纪录
    $scope.$watch("condition", function (newVal, oldVal) {
        if (newVal === oldVal) {
            return;
        }
        restAPI.pub.save({
            ID: 'getSynStatusLogInPage'
        }, {
            platform: app.store('platform'),
            query: $scope.condition.search,
            stime: $scope.condition.stime,
            etime: $scope.condition.etime
        }, function (data) {
            $scope.list = data.data.logs || [];
            $scope.pagination.totalRow = data.data.totalRow;
            $scope.pagination.pageNumber = 1;
            finishedLog.splice(0, finishedLog.length);
            notFinishedLog.splice(0, notFinishedLog.length);
            angular.forEach($scope.list, function (x) {
                if (x.status === "1") {
                    finishedLog.push(x);
                } else if (x.status === "2") {
                    notFinishedLog.push(x);
                }
            });
        });

    }, true);

    // 状态筛选
    $scope.$watch("searchh", function (newVal, oldVal) {
        if (newVal === oldVal) {
            return;
        }
        ;
        if ($scope.searchh.mark === "1") {
            $scope.list = notFinishedLog;
        }
        ;
        if ($scope.searchh.mark === "2") {
            $scope.list = finishedLog;
        }
        ;
    }, true);

    //分页纪录
    $scope.$on('genPagination', function (event, p) {
        if (event.stopPropagation)
            event.stopPropagation();

        restAPI.pub.save({
            ID: 'getSynStatusLogInPage'
        }, {
            platform: app.store('platform'),
            query: $scope.condition.search,
            stime: $scope.condition.stime,
            etime: $scope.condition.etime,
            pageNumber: p
        }, function (data) {
            $scope.list = data.data.logs || [];
            $scope.pagination.pageSize = 15;
            $scope.pagination.totalRow = data.data.totalRow;
            $scope.pagination.pageNumber = p;
        });
    });

}])/*.controller('appAndCampaignSynInfoCtrl', ['app', '$scope', '$interval', function (app, $scope, $interval) {

 if (!app.rootScope.global.isLogin) {
 app.$state.go('login');
 return;
 }

 var appkeys = app.store("pubAppkeys");

 var restAPI = app.restAPI;
 var timePromise = "yanshi";
 var delaytime = 120;
 $scope.list = [];
 $scope.pagination = {};
 $scope.upload = false;
 $scope.showDelaytime = true;

 $scope.setDelay = function (time) {
 $scope.second = time;
 timePromise = $interval(function () {
 if ($scope.second <= 0) {
 $interval.cancel(timePromise);
 if (delaytime > 15) {
 delaytime = delaytime / 2;
 } else if (delaytime > 10) {
 delaytime = delaytime - 5;
 }
 app.toast.info("自动刷新!");
 $scope.updateSynInfo();
 $scope.upload = true;
 } else {
 $scope.second--;
 }
 }, 1000, time + 1);
 };

 $scope.updateSynInfo = function () {
 restAPI.sys.save({
 ID: 'getPublishInfo'
 }, {
 platform: app.store('platform'),
 appkeys: appkeys
 }, function (data) {
 $scope.list = data.data.info;
 $scope.pagination.pageSize = 15;
 $scope.pagination.totalRow = data.data.totalRow;
 $scope.pagination.pageNumber = 1;
 if (!data.data.success) {
 if (timePromise !== undefined) {
 $scope.setDelay(delaytime);
 }
 app.toast.info("发布未完成,请耐心等待!");
 } else {
 timePromise = undefined;
 $scope.showDelaytime = false;
 app.toast.info("发布完成!");
 }
 });
 };

 $scope.updateSynInfo();

 $scope.$on('genPagination', function (event, p) {
 if (event.stopPropagation)
 event.stopPropagation();

 restAPI.sys.save({
 ID: 'getPublishInfo'
 }, {
 platform: app.store('platform'),
 appkeys: appkeys,
 pageNumber: p
 }, function (data) {
 $scope.list = data.data.info;
 $scope.pagination.pageSize = 15;
 $scope.pagination.totalRow = data.data.totalRow;
 $scope.pagination.pageNumber = p;
 });
 });

 $scope.newSynInfo = function () {
 restAPI.sys.save({
 ID: 'getPublishInfo'
 }, {
 platform: app.store('platform'),
 appkeys: appkeys
 }, function (data) {
 $scope.list = data.data.info;
 $scope.pagination.pageSize = 15;
 $scope.pagination.totalRow = data.data.totalRow;
 $scope.pagination.pageNumber = 1;
 if (!data.data.success) {
 app.toast.info("发布未完成,请耐心等待!");
 } else {
 if (timePromise !== undefined) {
 $interval.cancel(timePromise);
 timePromise = undefined;
 $scope.upload = false;
 $scope.showDelaytime = false;
 }

 app.toast.info("发布完成!");
 }
 });
 };
 }])
 */
    .controller('statisticsCtrl', ['app', '$scope', '$stateParams', 'GetDateStr', 'highchartsDefaultOptions', 'Highcharts', 'Excel', '$timeout',
        function (app, $scope, $stateParams, GetDateStr, highchartsDefaultOptions, Highcharts, Excel, $timeout) {

            if (!app.rootScope.global.isLogin) {
                app.$state.go('login');
                return;
            }
            var restAPI = app.restAPI,
                adtype = $stateParams.adtype,
                highchartsOptions = highchartsDefaultOptions();

            if (adtype !== "pic") {
                $scope.queryDate = "3";
            } else {
                $scope.queryDate = "1";
            }

            $scope.condition = {
                pname: "",
                reg: "",
                moreOfferType: "1",
                sdate: GetDateStr($scope.queryDate),
                edate: GetDateStr(1),
                pictype: "",
                ispage: false
            };//,pageNumber:1
            // if($scope.queryDate === "0") {
            $scope.condition.type = "0";
            // } else {
            //     $scope.condition.type = adtype;
            // }
            $scope.condition.adtype = adtype === "0" ? "" : adtype;
            //region 获取地区
            restAPI.sys.get({
                ID: 'listGeo'
            }, function (data) {
                $scope.regions = data.data;
            });

            //获取所有被推广的app
            restAPI.statistics.get({
                ID: "getUserPopularizedApp",
                OP: app.store('platform')
            }, function (data) {
                $scope.apps = data.data;
            });

            $scope.showImg = function (res) {
                $scope.myImg = res;
            };

            //监控时间
            $scope.$watch("queryDate", function (newVal, oldVal) {
                if (newVal === oldVal) {
                    return;
                }

                $scope.condition.sdate = GetDateStr(newVal);
                if (newVal === "1" || newVal === "0" || newVal === "2") {
                    //代表实时,按小时区分
                    $scope.condition.type = "1";
                    $scope.condition.edate = GetDateStr(newVal);
                } else if (newVal === "-1") {//本月(从这个月开始算到昨天)
                    //按天区分
                    $scope.condition.type = "0";
                    $scope.condition.sdate = GetDateStr(newVal);
                    $scope.condition.edate = GetDateStr(1);
                } else if (newVal === "-2") {//上月
                    //按天区分
                    $scope.condition.type = "0";
                    var dd = new Date();
                    var month = dd.getMonth();//上月
                    dd.setMonth(month);
                    dd.setDate(0);
                    var monthNum = dd.getDate();
                    $scope.condition.sdate = dd.getFullYear() + "-" + month + "-01";
                    $scope.condition.edate = dd.getFullYear() + "-" + month + "-" + monthNum;
                } else {
                    $scope.condition.edate = GetDateStr(1);
                }
            }, true);

            $scope.host_pagination = {};
            $scope.hostAppConversionList = [];
            $scope.pagination = {};
            //列表排序初始化
            /*$scope.col = 'click_num';//默认按click_num列排序
             $scope.desc = 1;//默认排序条件升序*/
            $scope.picStatisticsData = [];
            $scope.$watch("condition", function (newVal, oldVal) {

                //判断是否是图片点击
                if (adtype !== "pic") {
                    restAPI.statistics.save({
                        ID: 'getDataByCondition',
                        OP: app.store("platform")
                    }, $scope.condition, function (data) {
                        if (data.data) {
                            highchartsOptions.xAxis.categories = data.data.categories;
                            highchartsOptions.series = data.data.appDateList;
                            Highcharts.chart('chartContainer', highchartsOptions);
                        }
                    });

                    restAPI.statistics.save({
                        ID: 'getHostData',
                        OP: app.store("platform")
                    }, $scope.condition, function (data) {
                        $scope.conversionList = [];
                        $scope.hostAppConversionList = [];
                        $scope.host_pagination = {};
                        $scope.apptotal = null;
                        if (data.data) {
                            if (data.data.appConversionList) {
                                $scope.hostAppConversionList = data.data.appConversionList;
                                $scope.apptotal = data.data.apptotal;

                                $scope.conversionList = $scope.hostAppConversionList.slice(0, 20);
                                $scope.host_pagination.pageSize = 20;
                                $scope.host_pagination.totalRow = $scope.hostAppConversionList.length;
                                $scope.host_pagination.pageNumber = 1;
                            }
                        }
                    });
                } else {
                    //默认分页显示前20条
                    restAPI.statistics.save({
                        ID: 'getPicClickData',
                        OP: app.store("platform")
                    }, $scope.condition, function (data) {
                        if (data.data) {
                            $scope.picStatisticsData = data.data.piclist;
                            if ($scope.condition.ispage) {
                                $scope.pagination.pageSize = 500;
                            } else {
                                $scope.pagination.pageSize = 20;
                            }
                            $scope.pagination.totalRow = data.data.totalRow;
                            $scope.pagination.pageNumber = 1;
                        } else {
                            $scope.picStatisticsData = [];
                            $scope.pagination = {};
                        }
                    });
                }
            }, true);

            //分页
            $scope.$on('genPagination', function (event, p) {
                if (event.stopPropagation)
                    event.stopPropagation();
                if (adtype !== "pic") {
                    if ($scope.hostAppConversionList !== null) {
                        $scope.conversionList = $scope.hostAppConversionList.slice(20 * (p - 1), 20 * p);
                        $scope.host_pagination.pageSize = 20;
                        $scope.host_pagination.totalRow = $scope.hostAppConversionList.length;
                        $scope.host_pagination.pageNumber = p;
                    }
                } else {
                    var condition = angular.copy($scope.condition);
                    condition.pageNumber = p;
                    restAPI.statistics.save({
                        ID: 'getPicClickData',
                        OP: app.store("platform")
                    }, condition, function (data) {
                        if (data.data) {
                            $scope.picStatisticsData = data.data.piclist;
                            if ($scope.condition.ispage) {
                                $scope.pagination.pageSize = 500;
                            } else {
                                $scope.pagination.pageSize = 20;
                            }
                            $scope.pagination.totalRow = data.data.totalRow;
                            $scope.pagination.pageNumber = p;
                        } else {
                            $scope.picStatisticsData = [];
                            $scope.pagination = {};
                        }
                    });
                }
            });
            //宿主应用推广列表导出
            $scope.exportToExcel = function (tableId) { // ex: '#my-table'
                //if (adtype !== "pic"){
                // sheet name
                var promoteApp = $("#app-select2").find("option:selected").text();
                if ($scope.condition.pname === "") {
                    promoteApp = "All App";
                }
                $scope.exportHref = Excel.tableToExcel(tableId, promoteApp);
                $timeout(function () {
                    location.href = $scope.exportHref;
                }, 100); // trigger download
                //}
            }
        }]).controller('geoCtrl', ['app', '$scope', function (app, $scope) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    var restAPI = app.restAPI;

    restAPI.sys.get({
        ID: 'listGeo'
    }, function (data) {
        $scope.geoInfos = data.data;

        restAPI.sys.get({
            ID: 'listGeoext'
        }, function (data) {
            $scope.geoextInfos = data.data;
            angular.forEach($scope.geoInfos, function (x) {
                var flag = false;
                angular.forEach(x.region, function (x) {
                    flag = true;
                });
                if (!flag) {
                    delete x.region;
                }
                angular.forEach(x.region, function (y) {
                    var region = [];
                    angular.forEach($scope.geoextInfos, function (z) {
                        if (y === z.code) {
                            region.push(z.name);
                        }
                    });
                    x.region = region;
                });
                delete x.e_name;
                delete x._id;
            });
        });
    });
}]).controller('geoextCtrl', ['app', '$scope', function (app, $scope) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    var restAPI = app.restAPI;

    restAPI.sys.get({
        ID: 'listGeo'
    }, function (data) {
        $scope.geoInfos = data.data;
        restAPI.sys.get({
            ID: 'listGeoext'
        }, function (data) {
            $scope.geoextInfos = data.data;
            angular.forEach($scope.geoextInfos, function (x) {
                var geo = [];
                angular.forEach(x.geo, function (y) {
                    angular.forEach($scope.geoInfos, function (m) {
                        if (y === m.code) {
                            geo.push(m.name);
                        }
                    });
                });
                x.geo = geo;
            });
        });
    });
}]).controller('languageCtrl', ['app', '$scope', function (app, $scope) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    var restAPI = app.restAPI;

    restAPI.sys.get({
        ID: 'listLanguage'
    }, function (data) {
        $scope.languageInfos = data.data;
    });
}]).controller('marketCtrl', ['app', '$scope', function (app, $scope) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    var restAPI = app.restAPI;

    //获取市场信息
    restAPI.sys.get({
        ID: 'listMarket',
        OP: app.store("platform")
    }, function (data) {
        $scope.markets = data.data;
    });
}]).controller("resInfoCtrl", ['app', '$scope', '$stateParams', function (app, $scope) {

    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }
    var restAPI = app.restAPI;
    $scope.search = {};
    $scope.search.name = "";

    restAPI.sys.get({
        ID: 'listLanguage'
    }, function (data) {
        $scope.languageInfos = data.data;

        restAPI.res.get({
            ID: 'getRes',
            OP: app.store('platform')
        }, function (data) {
            $scope.resouce = data.data;
            angular.forEach($scope.resouce, function (x) {
                angular.forEach($scope.languageInfos, function (y) {
                    if (x.language === y.code) {
                        x.language = y.name;
                    }
                });
            });
            $scope.pagination = {};
            $scope.list = $scope.resouce.slice(0, 15);
            $scope.pagination.pageSize = 15;
            $scope.pagination.totalRow = $scope.resouce.length;
            $scope.pagination.pageNumber = 1;
        });
    });

    $scope.$watch('search.name', function (newVal, oldVal) {
        if (newVal === oldVal) {
            return;
        }
        restAPI.res.get({
            ID: 'getResInCondition',
            platform: app.store('platform'),
            query: $scope.search.name
        }, function (data) {
            $scope.resouce = data.data;
            angular.forEach($scope.resouce, function (x) {
                angular.forEach($scope.languageInfos, function (y) {
                    if (x.language === y.code) {
                        x.language = y.name;
                    }
                });
            });
            $scope.list = $scope.resouce.slice(0, 15);
            $scope.pagination.totalRow = $scope.resouce.length;
            $scope.pagination.pageNumber = 1;
        });
    });

    $scope.$on('genPagination', function (event, p, s) {
        if (event.stopPropagation)
            event.stopPropagation();
        restAPI.res.get({
            ID: 'getResInCondition',
            platform: app.store('platform'),
            query: $scope.search.name
        }, function (data) {
            $scope.resouce = data.data;
            angular.forEach($scope.resouce, function (x) {
                angular.forEach($scope.languageInfos, function (y) {
                    if (x.language === y.code) {
                        x.language = y.name;
                    }
                });
            });
            $scope.list = $scope.resouce.slice(15 * (p - 1), 15 * p);
            $scope.pagination.totalRow = $scope.resouce.length;
            $scope.pagination.pageNumber = p;
        });
    });

    $scope.showImg = function (img) {
        $scope.myImg = img;
    };

    //选择要迁移的资源
    $scope.selectTransferApp = function (imgName) {
        $scope.imgName = imgName;
        $scope.login_id = "";
        $scope.selfPassword = "";
    };

    //迁移资源
    $scope.transferUserRes = function () {
        if (angular.isUndefined($scope.login_id) || $scope.login_id === "" || $scope.login_id === null) {
            app.toast.info("请输入一个账户!");
            return;
        }

        var password = app.CryptoJS.SHA256($scope.selfPassword).toString();
        password = app.CryptoJS.HmacSHA256(password, 'blueshocks').toString();
        password = app.CryptoJS.HmacSHA256(password, app.store("user").login_id).toString();

        restAPI.user.get({
            ID: 'checkUser',
            OP: password
        }, function (data) {
            if (data.data === null) {
                restAPI.res.save({
                    ID: 'transferUserRes'
                }, {
                    imgName: $scope.imgName,
                    login_id: $scope.login_id,
                    platform: app.store("platform")
                }, function (data) {
                    if (data.data !== null) {
                        app.toast.info("图片已存在!");
                    } else {
                        app.toast.info("迁移成功!");
                    }
                    $("#userselector").modal('hide');
                });
            } else {
                app.toast.error("密码错误!请检查");
            }
        });
    };

    // 删除资源
    $scope.delImg = function (imgName, index) {
        app.confirmDialog({
            message: "确定删除吗?（慎用）",
            name: "图片名称:" + imgName + "，请检查当前图片是否应用到运营策略当中！！"
        }, function () {

            restAPI.res.save({
                ID: 'delImage',
                imgName: imgName,
                platform: app.store('platform')
            }, {}, function (data) {
                if (data.data != null) {
                    app.toast.warning(data.data.result);
                } else {
                    $scope.list.splice(index, 1);
                    app.toast.success("删除成功!");
                }
            });
        }, function () {
        });
    }


}]).controller("addResCtrl", ['app', '$scope', 'Upload', function (app, $scope, Upload) {

    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }
    var restAPI = app.restAPI;
    $scope.res = {};
    $scope.user = app.store("user");
    $scope.errors = [];
    $scope.iconImg = null;
    $scope.showImage = 'img/addPic.jpg';

    //获取语言列表
    restAPI.sys.get({
        ID: 'listLanguage'
    }, function (data) {
        $scope.languageInfos = data.data;
    });

    //获取资源列表
    restAPI.res.get({
        ID: 'getRes',
        OP: app.store('platform')
    }, function (data) {
        $scope.resouce = data.data;
    });

    $scope.$watch("iconImg", function (newVal, oldVal) {
        if (newVal === oldVal) {
            return;
        }
        if (newVal !== null) {
            if (newVal.name.indexOf('.zip') === -1) {
                $scope.showImage = newVal;
            } else {
                $scope.showImage = 'img/addZip.png';
            }
        }
    });

    //上传资源
    $scope.upload = function () {
        console.log($scope.iconImg);
        $scope.errors = [];
        var istrue = true;

        if (angular.isUndefined($scope.res.type) || $scope.res.type === "") {
            $scope.errors.push({"error": "请选择类型！"});
            istrue = false;
        } else {
            if ($scope.res.type !== "ic") {
                if (angular.isUndefined($scope.res.resolution) || $scope.res.resolution === "") {
                    $scope.errors.push({"error": "请选择或填写分辨率！"});
                    istrue = false;
                }
            }
        }

        if (angular.isUndefined($scope.iconImg) || $scope.iconImg === null) {
            $scope.errors.push({"error": "请上传图片！"});
            istrue = false;
        } else {
            if ($scope.iconImg.name.indexOf(".zip") === -1) {

                if ($scope.iconImg.name.indexOf(".jpg") === -1 && $scope.iconImg.name.indexOf(".png") === -1) {
                    $scope.errors.push({"error": "该图片格式不正确，请上传jpg和png格式的图片！"});
                    istrue = false;
                }

                angular.forEach($scope.resouce, function (x) {
                    if ($scope.iconImg.name === x.name) {
                        $scope.errors.push({"error": "该图片已存在，请修改图片名称！"});
                        istrue = false;
                    }
                });

                var imgName = $scope.iconImg.name.substring(0, $scope.iconImg.name.indexOf(".")).split("_");
                console.log(imgName);
                if ($scope.res.type !== "ic") {

                    if (angular.isUndefined(imgName[2])) {
                        $scope.errors.push({"error": "图片名称中类型未填写，请检查！"});
                        istrue = false;
                    }
                    if (angular.isUndefined(imgName[3])) {
                        $scope.errors.push({"error": "图片名称中分辨率未填写，请检查！"});
                        istrue = false;
                    }
                }
                if ($scope.res.type !== "ic") {
                    if ($scope.iconImg.size > 184320) {
                        $scope.errors.push({"error": ".图片最大上传大小为180k！"});
                        istrue = false;
                    }
                } else {
                    if ($scope.iconImg.size > 10240) {
                        $scope.errors.push({"error": ".图片最大上传大小为10k！"});
                        istrue = false;
                    }
                }
            } else {
                console.log($scope.iconImg.size);
                if ($scope.iconImg.size > 5242880) {
                    $scope.errors.push({"error": ".zip压缩包最大上传size为5M！"});
                    istrue = false;
                }
            }
            if (angular.isUndefined($scope.res.language) || $scope.res.language === "" || $scope.res.language === null) {
                $scope.res.language = "en";
            }
        }

        if (!istrue) {
            return;
        }
        $scope.iconImg.upload = Upload.upload({
            url: '/admin/api/res/uploadImage',
            fields: {
                platform: app.store("platform"),
                res: angular.toJson($scope.res)
            },
            file: $scope.iconImg
        });
        $scope.iconImg.upload.then(function (response) {
            if (response.data.data !== null) {
                $scope.errors = response.data.data;
                console.log('upload fail!');
            } else {
                app.toast.info("上传成功!");
                console.log('upload ok!');
            }
        }, function (response) {
            console.log('upload error');
        });
        $scope.iconImg.upload.xhr(function (xhr) {
            //access or attach event listeners to the underlying XMLHttpRequest
            xhr.upload.addEventListener('pending', function () {
                $scope.iconImg.upload.abort();
            });
        });
    };
}]).controller('superSubAccountCtrl', ['$scope', 'app', function ($scope, app) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    var restAPI = app.restAPI;
    $scope.user = app.store("user");
    $scope.newSubAccount = {};
    $scope.platform = app.store('platform');

    $scope.checkEmail = function (scope, model) {
        return app.filter('checkEmail')(model.$value);
    };

    $scope.checkTel = function (scope, model) {
        return app.filter('checkTel')(model.$value);
    };

    //获取所有子账户
    restAPI.user.get({
        ID: 'getUserAllSubAccount',
        OP: $scope.user.pubid,
        platform: app.store('platform')
    }, function (data) {
        $scope.subAccounts = data.data;
    });

    $scope.showAddSubAccountModal = function () {
        $scope.subAccount = {};
        $scope.accountJurisdiction = {};
        $scope.accountJurisdiction.para_ctrl = true;
        $scope.accountJurisdiction.para_inject = false;
        $scope.accountJurisdiction.view_adstrategy = false;
        $scope.accountJurisdiction.new_adstrategy = false;
        $scope.accountJurisdiction.view_task = false;
        $scope.accountJurisdiction.new_task = false;
        $scope.accountJurisdiction.app_ctrl = false;
        $scope.accountJurisdiction.view_strategy = false;
        $scope.accountJurisdiction.new_strategy = false;
        $scope.accountJurisdiction.user_ctrl = false;
        $scope.accountJurisdiction.view_resource = false;
        $scope.accountJurisdiction.upload_resource = false;
        $scope.accountJurisdiction.statistics_ctrl = false;
        $scope.accountJurisdiction.area_ctrl = false;
        $scope.accountJurisdiction.publish_application = false;
        $scope.accountJurisdiction.new_tag = false;
        $scope.accountJurisdiction.view_tag = false;
    };

    $scope.showEditSubAccountModal = function (account) {
        $scope.subAccount = account;
        $scope.accountJurisdiction = account.jurisdiction;
    };

    //新增子账户
    $scope.addSubAccount = function () {
        if (app.validate($scope)) {
            var account = {};
            var data = {
                login_id: $scope.subAccount.login_id,
                contacts: $scope.subAccount.contacts,
                telephone: $scope.subAccount.telephone,
                company_name: $scope.subAccount.company_name
            };
            data.password = app.CryptoJS.SHA256($scope.subAccount.password).toString();
            data.password = app.CryptoJS.HmacSHA256(data.password, 'blueshocks').toString();

            account.newSubAccount = data;
            account.subAccontJurisdiction = $scope.accountJurisdiction;
            restAPI.user.save({
                ID: 'addSubAccount',
                OP: $scope.user.pubid,
                platform: app.store("platform")
            }, account, function (data) {
                $scope.subAccounts.push(data.data);
                $("#addSubAccountPanel").modal('hide');
                app.toast.info("添加成功!");
            });
        }
    };

    //修改子账户权限
    $scope.updateSubAccountJurisdiction = function () {
        restAPI.user.save({
            ID: 'updateSubAccountJurisdiction',
            OP: app.store("platform")
        }, {
            pubid: $scope.subAccount.pubid,
            subpubid: $scope.subAccount.subpubid,
            jurisdiction: $scope.accountJurisdiction,
        }, function () {
            $("#editSubAccountPanel").modal('hide');
            app.toast.info("修改成功!");
        });
    };

    //删除子账户
    $scope.delSubAccount = function (index) {
        var account = $scope.subAccounts[index];
        app.confirmDialog({
            message: "确定删除吗?",
            name: "账号:" + account.login_id
        }, function () {

            restAPI.user.save({
                ID: 'delSubAccount',
                pubid: $scope.user.pubid,
                subpubid: account.subpubid
            }, {}, function () {
                $scope.subAccounts.splice(index, 1);
                app.toast.info("删除成功!");
            });
        }, function () {
        });
    };
}]).controller('subAccountCtrl', ['$scope', 'app', function ($scope, app) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    var restAPI = app.restAPI;
    $scope.user = app.store("user");
    $scope.newSubAccount = {};
    $scope.platform = app.store('platform');

    $scope.checkEmail = function (scope, model) {
        return app.filter('checkEmail')(model.$value);
    };

    $scope.checkTel = function (scope, model) {
        return app.filter('checkTel')(model.$value);
    };

    //获取所有子账户
    restAPI.user.get({
        ID: 'getUserAllSubAccount',
        OP: $scope.user.pubid,
        platform: app.store('platform')
    }, function (data) {
        $scope.subAccounts = data.data;
    });

    //获取主账户所有的应用组
    restAPI.app.get({
        ID: 'getUserAllLinkid',
        OP: app.store('platform')
    }, function (data) {
        $scope.linkids = data.data;
        angular.forEach($scope.linkids, function (x) {
            x.checked = false;
        });
    });

    $scope.showAddSubAccountModal = function () {
        $scope.subAccount = {};
        $scope.accountJurisdiction = {};
        $scope.accountJurisdiction.view_application = true;
        $scope.accountJurisdiction.managed_application = false;
        $scope.accountJurisdiction.managed_ad = false;
        $scope.accountJurisdiction.new_application = false;
        $scope.accountJurisdiction.view_task = false;
        $scope.accountJurisdiction.new_task = false;
        $scope.accountJurisdiction.publish_application = false;
        $scope.accountJurisdiction.status_log = false;
        $scope.accountJurisdiction.application_group = false;
        $scope.accountJurisdiction.view_strategy = false;
        $scope.accountJurisdiction.view_publish = false;
        $scope.accountJurisdiction.new_strategy = false;
        $scope.accountJurisdiction.view_resource = false;
        $scope.accountJurisdiction.upload_resource = false;
        $scope.accountJurisdiction.testid = false;
        $scope.accountJurisdiction.timingTask = false;
        $scope.myLinkids = [];
    };

    $scope.showEditSubAccountModal = function (account) {
        $scope.subAccount = account;
        $scope.accountJurisdiction = account.jurisdiction;
        $scope.myLinkids = account.linkids;
        //初始化应用组
        angular.forEach($scope.linkids, function (x) {
            x.checked = false;
        });
        //检查有哪些已经添加的应用组
        angular.forEach($scope.linkids, function (x) {
            angular.forEach($scope.myLinkids, function (y) {
                if (x.linkid === y) {
                    x.checked = true;
                }
            });
        });
        //检查已有的应用组中有哪些应用组已修改，需要删除
        angular.forEach($scope.myLinkids, function (x, m) {
            var flag = false;
            angular.forEach($scope.linkids, function (y) {
                if (x === y.linkid) {
                    flag = true;
                }
            });

            if (!flag) {
                $scope.myLinkids.splice(m, 1);
            }
        });
    };

    //选择应用组
    $scope.selectLinkid = function (index) {
        var linkid = $scope.linkids[index];
        if (linkid.checked) {
            $scope.myLinkids.pop(linkid.linkid);
        } else {
            $scope.myLinkids.push(linkid.linkid);
        }
    };

    //新增子账户
    $scope.addSubAccount = function () {
        if (app.validate($scope)) {
            var account = {};
            var data = {
                login_id: $scope.subAccount.login_id,
                contacts: $scope.subAccount.contacts,
                telephone: $scope.subAccount.telephone,
                company_name: $scope.subAccount.company_name
            };
            data.password = app.CryptoJS.SHA256($scope.subAccount.password).toString();
            data.password = app.CryptoJS.HmacSHA256(data.password, 'blueshocks').toString();

            account.newSubAccount = data;
            account.subAccontJurisdiction = $scope.accountJurisdiction;
            account.linkids = $scope.myLinkids;
            restAPI.user.save({
                ID: 'addSubAccount',
                OP: $scope.user.pubid,
                platform: app.store("platform")
            }, account, function (data) {
                $scope.subAccounts.push(data.data);
                $("#addSubAccountPanel").modal('hide');
                app.toast.info("添加成功!");
            });
        }
    };

    //修改子账户权限
    $scope.updateSubAccountJurisdiction = function () {
        restAPI.user.save({
            ID: 'updateSubAccountJurisdiction',
            OP: app.store("platform")
        }, {
            pubid: $scope.subAccount.pubid,
            subpubid: $scope.subAccount.subpubid,
            jurisdiction: $scope.accountJurisdiction,
            linkids: $scope.myLinkids
        }, function () {
            $("#editSubAccountPanel").modal('hide');
            app.toast.info("修改成功!");
        });
    };

    //删除子账户
    $scope.delSubAccount = function (index) {
        var account = $scope.subAccounts[index];
        app.confirmDialog({
            message: "确定删除吗?",
            name: "账号:" + account.login_id
        }, function () {

            restAPI.user.save({
                ID: 'delSubAccount',
                pubid: $scope.user.pubid,
                subpubid: account.subpubid
            }, {}, function () {
                $scope.subAccounts.splice(index, 1);
                app.toast.info("删除成功!");
            });
        }, function () {
        });
    };

    //重置用户的密码
    $scope.resetPassword = function (subpubid, name) {
        app.confirmDialog({
            message: "确定重置该用户的密码?",
            name: "用户邮箱:" + name
        }, function () {
            restAPI.user.save({
                ID: 'resetPassword'
            }, {
                pubid: subpubid
            }, function () {
                app.toast.success("密码重置成功!");
            });
        }, function () {

        });
    };
}]).controller('noticeInfoCtrl', ['app', '$scope', function (app, $scope) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    var restAPI = app.restAPI;
    $scope.pagination = {};

    //获取所有系统通知
    restAPI.notice.save({
        ID: 'getNoticeInfo'
    }, {
        platform: app.store('platform')
    }, function (data) {
        $scope.infos = data.data.noticeInfos;
        $scope.pagination.pageSize = 15;
        $scope.pagination.totalRow = data.data.totalRow;
        $scope.pagination.pageNumber = 1;
    });

    $scope.$on('genPagination', function (event, p) {
        if (event.stopPropagation)
            event.stopPropagation();

        restAPI.notice.save({
            ID: 'getNoticeInfo'
        }, {
            platform: app.store('platform'),
            pageNumber: p
        }, function (data) {
            $scope.infos = data.data.noticeInfos;
            $scope.pagination.totalRow = data.data.totalRow;
            $scope.pagination.pageNumber = p;
        });
    });
    // 实现每点一个消息，系统提醒的消息数量减一
    var alreadyclickmessage = [];
    $scope.showNoticeInfo = function (index) {
        $scope.showInfo = $scope.infos[index];
        if ($.inArray(index, alreadyclickmessage) === -1) {  // 数组不存在消息
            alreadyclickmessage.push(index);
            if (app.rootScope.messagecount !== 0) {
                app.rootScope.messagecount = app.rootScope.messagecount - 1;
                restAPI.user.save({
                    ID: 'delNoticeInfoByUser'
                }, {
                    platform: app.store('platform'),
                    user: app.store('user')
                }, function (data) {
                });
            }
        }
    }
}]).controller('taskAdStrategyInfoCtrl', ['app', '$scope', function (app, $scope) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    var restAPI = app.restAPI;

    var options = {
        mode: 'tree',
        modes: ['code', 'form', 'text', 'tree', 'view']
    };

    $scope.options = options;
    $scope.mystrategy = {};
    $scope.condition = {};
    $scope.pagination = {};
    $scope.condition.query = "";

    //获取广告策略
    restAPI.app.save({
        ID: 'getPrivateAd'
    }, {
        platform: app.store('platform')
    }, function (data) {
        $scope.adStrategys = data.data.privateStrategys || [];
        $scope.pagination.pageSize = 15;
        $scope.pagination.totalRow = data.data.totalRow;
        $scope.pagination.pageNumber = 1;
    });

    $scope.$watch("condition.query", function (newVal, oldVal) {
        if (newVal === oldVal) {
            return;
        }

        restAPI.app.save({
            ID: 'getPrivateAd'
        }, {
            platform: app.store('platform'),
            query: $scope.condition.query
        }, function (data) {
            $scope.adStrategys = data.data.privateStrategys || [];
            $scope.pagination.pageSize = 15;
            $scope.pagination.totalRow = data.data.totalRow;
            $scope.pagination.pageNumber = 1;
        });
    });

    $scope.$on('genPagination', function (event, p) {
        if (event.stopPropagation)
            event.stopPropagation();

        restAPI.app.save({
            ID: 'getPrivateAd'
        }, {
            platform: app.store('platform'),
            query: $scope.condition.query,
            pageNumber: p
        }, function (data) {
            $scope.adStrategys = data.data.privateStrategys;
            $scope.pagination.totalRow = data.data.totalRow;
            $scope.pagination.pageNumber = p;
        });
    });

    //初始化超管编辑广告策略modal
    $scope.showUpdateModal = function (adStrategy) {
        $scope.mystrategy.value = app.union(adStrategy.value);
        $scope.newName = adStrategy.name;
        $scope.id = adStrategy._id.$oid;
    };

    //初始化超管复制广告策略modal
    $scope.copyStrategyModal = function (adStrategy) {
        $scope.copystrategy = app.union(adStrategy);
        $scope.copystrategy.name = "";
        delete $scope.copystrategy._id;
    };

    $scope.updateAdStrategy = function () {

        if (!($scope.mystrategy.value instanceof Object)) {
            app.toast.warning("策略不是json对象!请修改!");
            return;
        }

        if ($scope.newName === undefined || $scope.newName === "") {
            app.toast.warning("名称不能为空！");
            return;
        }

        restAPI.app.save({
            ID: 'updatePrivateAd'
        }, {
            platform: app.store("platform"),
            value: $scope.mystrategy.value,
            newName: $scope.newName,
            adStrategyId: $scope.id
        }, function () {
            angular.forEach($scope.adStrategys, function (x) {
                if (x._id.$oid === $scope.id) {
                    x.value = app.union($scope.mystrategy.value);
                    x.name = $scope.newName;
                }
            });
            $scope.mystrategy.value = {};
            $("#showUpdateModal").modal('hide');
            app.toast.success("更新成功！");
        });
    };

    $scope.delAdStrategy = function (index, id, name) {

        app.confirmDialog({
            message: "确定删除该策略?",
            name: "策略名称:" + name
        }, function () {
            restAPI.sadmin.save({
                ID: 'delPrivateAdForSadmin'
            }, {
                id: id
            }, function () {
                app.toast.success("删除成功！");
                $scope.adStrategys.splice(index, 1);
            });
        }, function () {

        });
    }
}]).controller('taskAdStrategyInsertCtrl', ['app', '$scope', function (app, $scope) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    var restAPI = app.restAPI;
    $scope.errors = [];
    var user = app.store("user");
    var jsonData = {},
        options = {
            mode: 'tree',
            modes: ['code', 'form', 'text', 'tree', 'view']
        };
    $scope.data = jsonData;
    $scope.options = options;
    $scope.errors = [];
    if ($scope.user.pub_level === "0") {
        $scope.pubid = "";
    } else {
        $scope.pubid = $scope.user.pubid;
    }


    restAPI.sadmin.get({
        ID: 'getAllUserInfoGroupByCompanyName'
    }, function (data) {
        $scope.users = data.data;
        angular.forEach($scope.users, function (x) {
            x.showName = x.company_name + "-" + x.contacts;
        });
    });

    $scope.callback = function (file) {
        jsonData = JSON.parse(file.content);
        $scope.jsonfile = file;
        $scope.data = jsonData;
        $scope.isJson = ($scope.jsonfile.name.split('.')[1] === 'json');
    };

    $scope.submit = function () {
        $scope.errors = [];
        var isAdStrategy = true;

        //校验json，如果json格式有误，$scope.data为空对象
        var flag = true;
        angular.forEach($scope.data, function () {
            flag = false;
        });
        if (flag) {
            $scope.errors.push({"error": "json为空或json格式有误！请检查后重新上传json文件！"});
            isAdStrategy = false;
        }

        if ($scope.pubid === undefined || $scope.pubid === "") {
            $scope.errors.push({"error": "请选择一个账户!"});
            isAdStrategy = false;
        }

        var data = [];
        var temp = angular.copy($scope.data);
        if (angular.isArray($scope.data)) {
            data = temp;
        } else if (angular.isObject($scope.data)) {
            data.push(temp);
        }

        //对必须有的字段进行校验
        angular.forEach(data, function (x, m) {
            if (x.name === undefined || x.name === null || x.name === "") {
                $scope.errors.push({"error": "请填写name字段!"});
                isAdStrategy = false;
            }

            if (data.length > 1) {
                angular.forEach(data, function (y, n) {
                    if (m !== n && x.name === y.name) {
                        $scope.errors.push({"error": "填写的策略名有重复，请检查!"});
                        isAdStrategy = false;
                    }
                });
            }

            if (!(x.value instanceof Object) || x.value instanceof Array) {
                $scope.errors.push({"error": "value字段必填,value为json对象!"});
                isAdStrategy = false;
            }
        });

        if (!isAdStrategy) {
            return;
        }

        //添加平台,广告适用的用户
        angular.forEach(data, function (x) {
            x.platform = app.store("platform");
            //适用的用户
            x.pubid = $scope.pubid;
            angular.forEach($scope.users, function (y) {
                if (y.pubid === $scope.pubid) {
                    x.accountname = y.showName;
                    //创建者
                    x.creator = y.company_name;
                }
            });
        });

        restAPI.sadmin.save({
            ID: "addPrivateAdForSadmin"
        }, data, function () {
            app.$state.go("timingTask.taskAdStrategyInfo");
        });
    };
}]).controller("appTimingTaskCtrl", ["app", "$scope", "$stateParams", function (app, $scope, $stateParams) {

    var restAPI = app.restAPI;
    var appkey = $stateParams.appkey;
    console.log(new Date().toLocaleDateString());

    $scope.timingTask = {};
    $scope.timingTask.strategies = [];
    $scope.errors = [];

    // $('#reservation').daterangepicker(null, function(start, end, label) {
    //     console.log(start);
    //     console.log(end);
    //     $scope.$apply(function () {
    //         var startDate = new Date(start);
    //         $scope.search.stime = startDate.getFullYear()+ "-" + (startDate.getMonth()+1) + "-" + startDate.getDate() + " 00:00:00";
    //         var endDate = new Date(end);
    //         $scope.search.etime = endDate.getFullYear()+ "-" + (endDate.getMonth()+1) + "-" + endDate.getDate() + " 23:59:59";
    //     });
    // });

    //获取所有广告策略
    //获取广告策略
    restAPI.app.get({
        ID: 'getAdStrategy',
        OP: app.store("platform")
    }, function (data) {
        $scope.adStrategys = data.data;
    });

    //获取应用的定时任务
    restAPI.app.get({
        ID: 'getAppTimingTask',
        OP: appkey
    }, function (data) {
        if (data.data !== null) {
            $scope.timingTask = data.data;
        }
    });

    //新增任务起始节点
    $scope.addStartTask = function () {
        var temp = {};
        if ($scope.timingTask.strategies.length > 0) {
            temp.edate = $scope.timingTask.strategies[0].sdate;
        } else {
            temp.edate = "";
        }
        temp.sdate = "";
        temp.adStrategyId = "";
        $scope.timingTask.strategies.unshift(temp);
    };

    //新增任务末尾节点
    $scope.addEndTask = function () {
        var temp = {};
        if ($scope.timingTask.strategies.length > 0) {
            temp.sdate = $scope.timingTask.strategies[$scope.timingTask.strategies.length - 1].edate;
        } else {
            temp.sdate = "";
        }
        temp.edate = "";
        temp.adStrategyId = "";
        $scope.timingTask.strategies.push(temp);
    };

    //删除任务节点
    $scope.delTask = function (index) {
        app.confirmDialog({
            message: "确定删除吗？"
        }, function () {
            var strategy = $scope.timingTask.strategies[index];
            if (strategy.taskId === undefined || strategy.taskId === "") {
                $scope.timingTask.strategies.splice(index, 1);
            } else {
                restAPI.app.save({
                    ID: "delTimingTaskNode"
                }, {
                    taskId: strategy.taskId
                }, function () {
                    $scope.timingTask.strategies.splice(index, 1);
                });
            }
        }, function () {

        });
    };

    /*$scope.updateTask = function (adStrategyId) {
     //如果appkey不存在，说明是公共的广告策略，需要复制一份为自己的私有策略
     //如果AppKey存在，说明本身就是私有的策略，只需要前往'定时任务-任务策略'中修改即可
     app.confirmDialog({
     message:"此策略为公共的广告策略，确定后会自动创建一个私有的广告策略与该应用绑定在一起！之后请前往'定时任务-任务策略'中修改！"
     }, function () {
     restAPI.app.save({
     ID: 'updateTaskAd'
     }, {
     appkey: appkey,
     adStrategyId: adStrategyId
     });
     }, function (data) {
     //还需要重新获取广告策略
     restAPI.app.get({
     ID: 'getAdStrategy',
     OP: app.store("platform")
     }, function (data) {
     $scope.adStrategys = data.data;
     });
     });
     };*/

    //开始定时任务
    $scope.addTimingTask = function () {
        var flag = true;
        $scope.errors = [];

        if ($scope.timingTask.name === undefined || $scope.timingTask.name === "") {
            $scope.errors.push({error: "任务名称不能为空!"});
            return;
        }

        if ($scope.timingTask.strategies.length === 0) {
            $scope.errors.push({error: "任务内容为空，请新增任务节点!"});
            return;
        }

        if ($scope.timingTask.strategies.length > 1) {
            angular.forEach($scope.timingTask.strategies, function (x, m) {

                if (m < $scope.timingTask.strategies.length - 1) {
                    if (x.edate !== $scope.timingTask.strategies[m + 1].sdate) {
                        $scope.errors.push({error: "第为" + (m + 1) + "个任务节点的结束时间不等于后一个任务节点的起始时间!"});
                        flag = false;
                    }
                }

                if (x.sdate >= x.edate) {
                    $scope.errors.push({error: "起始时间不能大于或者等于终止时间!"});
                    flag = false;
                }
            });
        }

        angular.forEach($scope.timingTask.strategies, function (x, m) {
            if (x.adStrategyId === null || x.adStrategyId === undefined || x.adStrategyId === "") {
                $scope.errors.push({error: "第为" + (m + 1) + "个任务节点选择策略!"});
                flag = false;
            }
            if (x.sdate === null || x.sdate === undefined || x.sdate === "") {
                $scope.errors.push({error: "第为" + (m + 1) + "个任务节点起始时间为空!"});
                flag = false;
            }
            if (x.edate === null || x.edate === undefined || x.edate === "") {
                $scope.errors.push({error: "第为" + (m + 1) + "个任务节点终止时间为空!"});
                flag = false;
            }
        });

        if (!flag) {
            return;
        }

        $scope.timingTask.appkey = appkey;

        restAPI.app.save({
            ID: 'startAppTimingTask'
        }, $scope.timingTask, function () {
            app.toast.info("开始定时任务");
            app.$state.go("index.appAdStrategy");
        });
    };

    //修改定时任务
    // $scope.changeTimingTask = function () {
    //
    // }
}])

/****************************************超管部分***************************************/

    .controller('sadminCtrlParamInfoCtrl', ['app', '$scope', function (app, $scope) {
        if (!app.rootScope.global.isLogin) {
            app.$state.go('login');
            return;
        }

        //检测是否为超管
        if (app.store("user").pub_level === "1") {
            app.rootScope.goBack();
            return;
        }
        var restAPI = app.restAPI;

        var options = {
            mode: 'tree',
            modes: ['code', 'form', 'text', 'tree', 'view']
        };
        $scope.options = options;

        //获取用户级别控制参数
        restAPI.sadmin.get({
            ID: 'getCtrlUserParam',
            OP: app.store("platform")
        }, function (data) {
            $scope.userCtrlParams = data.data;
            angular.forEach($scope.userCtrlParams, function (x) {
                if (x.value instanceof Array) {
                    x.type = "2";
                } else if (x.value instanceof Object) {
                    x.type = "3";
                } else {
                    x.type = "1";
                }
            });
        });

        //获取系统级别控制参数
        restAPI.sadmin.get({
            ID: 'getCtrlSysParam',
            OP: app.store("platform")
        }, function (data) {
            $scope.sysCtrlParams = data.data;
        });

        //获取个性化级别控制参数
        restAPI.sadmin.get({
            ID: 'getCtrlParam',
            OP: app.store("platform")
        }, function (data) {
            $scope.ctrlParams = data.data;
        });

        //获取所有普通用户
        restAPI.user.get({
            ID: 'getAllUserInfoForAdmin'
        }, function (data) {
            $scope.users = data.data;
        });

        //打开修改参数modal时初始化参数
        $scope.showUpdateCtrlParamModal = function (param) {
            $scope.updateParam = param;
        };

        //打开新增系统级别参数modal时初始化参数
        $scope.showAddSysCtrlParamModal = function () {
            $scope.errors = [];
            $scope.addParam = {};
            $scope.addParam.key = "";
            $scope.addParam.level = "0";
            $scope.addParam.type = "1";
        };

        //打开新增用户级别参数modal时初始化参数
        $scope.showAddUserCtrlParamModal = function () {
            $scope.errors = [];
            $scope.addParam = {};
            $scope.addParam.key = "";
            $scope.addParam.level = "1";
            $scope.addParam.type = "1";
        };

        //打开新增个性化级别参数modal时初始化参数
        $scope.showAddCtrlParamModal = function () {
            $scope.errors = [];
            $scope.addParam = {};
            $scope.addParam.key = "";
            $scope.addParam.level = "2";
            $scope.addParam.type = "1";
        };

        //增加控制参数
        $scope.addCtrlParam = function () {

            if (angular.isUndefined($scope.addParam.level) || $scope.addParam.level === "") {
                app.toast.error("级别不能为空！");
                return;
            }

            if (angular.isUndefined($scope.addParam.key) || $scope.addParam.key === "") {
                app.toast.error("参数名不能为空！");
                return;
            }

            $scope.addParam.platform = app.store("platform");

            //增加系统级别控制参数
            if ($scope.addParam.level === "0") {
                restAPI.sadmin.save({
                    ID: 'addCtrlSysParam',
                    OP: app.store("platform")
                }, $scope.addParam, function () {
                    $scope.sysCtrlParams.push($scope.addParam);
                    $('#insertParamPanel').modal('hide');
                    app.toast.success("添加成功！");
                });
            }

            //增加用户级别控制参数
            if ($scope.addParam.level === "1") {
                $scope.errors = [];
                if ($scope.addParam.type === "3" && !($scope.addParam.value instanceof Object)) {
                    $scope.errors.push({error: "json对象格式不对,请检查!"});
                    return;
                }

                if ($scope.addParam.type === "1" && !(typeof ($scope.addParam.value) === 'string')) {
                    $scope.errors.push({error: "不是String,请检查!"});
                    return;
                }

                if ($scope.addParam.type === "2" && !($scope.addParam.value instanceof Array)) {
                    $scope.errors.push({error: "json数组格式不对,请检查!"});
                    return;
                } else if ($scope.addParam.type === "2" && $scope.addParam.value instanceof Array) {
                    var flag = true;
                    angular.forEach($scope.addParam.value, function (x) {
                        if (!(x instanceof Object)) {
                            flag = false;
                        }
                    });
                    if (!flag) {
                        $scope.errors.push({error: "json数组格式不对,内部为json对象请检查!"});
                        return;
                    }
                }

                restAPI.sadmin.save({
                    ID: 'addCtrlUserParam',
                    OP: app.store("platform")
                }, $scope.addParam, function () {
                    $scope.userCtrlParams.push($scope.addParam);
                    $('#insertParamPanel').modal('hide');
                    app.toast.success("添加成功！");
                });
            }

            //增加个性化级别控制参数
            if ($scope.addParam.level === "2") {
                restAPI.sadmin.save({
                    ID: 'addCtrlParam',
                    OP: app.store("platform")
                }, $scope.addParam, function () {
                    $scope.ctrlParams.push($scope.addParam);
                    $('#insertParamPanel').modal('hide');
                    app.toast.success("添加成功！");
                });
            }

        };

        //更新控制参数
        $scope.updateCtrlParam = function () {
            //系统级别控制参数更新
            if ($scope.updateParam.level === "0") {
                restAPI.sadmin.save({
                    ID: 'updateCtrlSysParam',
                    OP: app.store("platform")
                }, $scope.updateParam, function () {
                    app.toast.success("更新成功！");
                });
            }

            //用户级别控制参数更新
            if ($scope.updateParam.level === "1") {
                restAPI.sadmin.save({
                    ID: 'updateCtrlUserParam',
                    OP: app.store("platform")
                }, $scope.updateParam, function () {
                    app.toast.success("更新成功！");
                });
            }

            //个性化级别控制参数更新
            if ($scope.updateParam.level === "2") {

                if ($scope.pubid === null || $scope.pubid === undefined || $scope.pubid === "") {
                    app.toast.warning("请选择用户!");
                    return;
                }
                restAPI.sadmin.save({
                    ID: 'updateCtrlParam',
                    OP: app.store("platform")
                }, {
                    param: $scope.updateParam,
                    pubid: $scope.pubid
                }, function () {
                    app.toast.success("更新成功！");
                    $("#updateCustomParamPanel").modal('hide');
                });
            }
        };

        //删除控制参数
        $scope.delCtrlSysParam = function (param, index) {
            var param = param;
            app.confirmDialog({
                message: "确定删除吗?",
                name: "参数:" + param.key
            }, function () {

                //系统级别控制参数删除
                restAPI.sadmin.save({
                    ID: 'delCtrlSysParam',
                    OP: app.store("platform")
                }, param, function () {
                    $scope.sysCtrlParams.splice(index, 1);
                    app.toast.success("删除成功！");
                });
            });
        };

        $scope.delCtrlUserParam = function (param, index) {
            var param = param;
            app.confirmDialog({
                message: "确定删除吗?",
                name: "参数:" + param.key
            }, function () {

                //用户级别控制参数删除
                restAPI.sadmin.save({
                    ID: 'delCtrlUserParam',
                    OP: app.store("platform")
                }, param, function () {
                    $scope.userCtrlParams.splice(index, 1);
                    app.toast.success("删除成功！");
                });
            });
        };

        $scope.delCtrlParam = function (param, index) {
            var param = param;
            app.confirmDialog({
                message: "确定删除吗?",
                name: "参数:" + param.key
            }, function () {

                //个性化级别控制参数删除
                restAPI.sadmin.save({
                    ID: 'delCtrlParam',
                    OP: app.store("platform")
                }, param, function () {
                    $scope.ctrlParams.splice(index, 1);
                    app.toast.success("删除成功！");
                });
            });
        };
    }]).controller('sadminInjectParamInfoCtrl', ['app', '$scope', function (app, $scope) {

    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    //检测是否为超管
    if (app.store("user").pub_level === "1") {
        app.rootScope.goBack();
        return;
    }
    var restAPI = app.restAPI;
    var param;
    var paramkeys = ["geo", "areacode", "resolution", "oscode", "vcode", "sdkcode", "time", "date", "net", "adtype",
        "page", "entry", "market", "ad_family", "language", "devicetype", "usergroup", "category", "tag", "vtime", "level",
        "icon_template", "cross_filter", "gift_template", "check_ctrl", "devicemodel", "ipfeature", "ip"];
    $scope.isAddParam = false;

    //获取注入参数
    restAPI.sadmin.get({
        ID: 'getInjectParam',
        OP: app.store("platform")
    }, function (data) {
        $scope.injectParams = data.data;
    });

    //打开modal时初始化更新参数
    $scope.showUpdateInjectParamModal = function (index) {
        param = $scope.injectParams[index];
        $scope.isAddParam = false;
        $scope.param = angular.copy(param);
        $scope.errors = [];
    };

    //打开modal时初始化新增参数
    $scope.showAddInjectParamModal = function () {
        $scope.isAddParam = true;
        $scope.param = {};
        $scope.param.platform = app.store('platform');
        //描述注入参数有无公有条件,0代表有公有条件\1代表无公有条件
        $scope.param.paramtype = "0";
        $scope.errors = [];
    };

    function checkCondition(condition, conditionType) {
        var istrue = true;

        if (condition === "") {
            return true;
        }
        //对condition中的内容进行验证
        var openCondition1 = condition.split("$$");
        var conditions = [];
        angular.forEach(openCondition1, function (x) {
            var temp = x.split("||");
            angular.forEach(temp, function (y) {
                conditions.push(y);
            });
        });
        angular.forEach(conditions, function (x, m) {
            if (x.indexOf(":") === -1 || x.indexOf(":") !== x.lastIndexOf(":")) {
                $scope.errors.push({error: conditionType + "条件中的第" + (m + 1) + "个条件的格式不对! key与value之间没有用':'分隔或是有多个':', 多个条件之间用'$$'分隔"});
                istrue = false;
            }

            var key = x.substr(0, x.indexOf(":"));
            if (key.indexOf("_") === -1) {
                $scope.errors.push({error: conditionType + "条件中的第" + (m + 1) + "个条件的名称不对,请查看文档中心-系统编码!"});
                istrue = false;
            } else {
                if (key.indexOf("_") === key.lastIndexOf("_")) {
                    if (key.indexOf("_in") !== -1) {
                        key = key.substr(0, key.indexOf("_in"));
                    } else if (key.indexOf("_out") !== -1) {
                        key = key.substr(0, key.indexOf("_out"));
                    }
                    var flag = false;
                    angular.forEach(paramkeys, function (y) {
                        if (y === key) {
                            flag = true;
                        }
                    });

                    if (!flag) {
                        $scope.errors.push({error: conditionType + "条件中的第" + (m + 1) + "个条件的名称不对,请查看文档中心-系统编码!"});
                        istrue = false;
                    }
                } else {
                    $scope.errors.push({error: conditionType + "条件中的第" + (m + 1) + "个条件的名称不对,请查看文档中心-系统编码!"});
                    istrue = false;
                }
            }
        });

        return istrue;
    }

    //更新注入参数
    $scope.updateInjectParam = function () {
        $scope.errors = [];
        //对控制开关进行验证
        if ($scope.param.switch.trim() === "") {
            $scope.errors.push({error: "开关只能是0或者1,1代表开启,0代表关闭"});
            return;
        }

        if ("01".indexOf($scope.param.switch) === -1) {
            $scope.errors.push({error: "开关只能是0或者1,1代表开启,0代表关闭"});
            return;
        }

        var openCondition = $scope.param.open_condition;
        if (openCondition !== undefined) {
            if (!checkCondition(openCondition, "公有条件")) {
                return;
            }
        }

        var inCondition = $scope.param.in_condition;
        if (!checkCondition(inCondition, "私有条件")) {
            return;
        }

        restAPI.sadmin.save({
            ID: 'updateInjectParam',
            OP: app.store('platform')
        }, $scope.param, function () {
            $("#paramInjectPanel").modal('hide');
            param.switch = $scope.param.switch;
            param.open_condition = $scope.param.open_condition;
            param.in_condition = $scope.param.in_condition;
            param = {};
            app.toast.success("更新成功！");
        });
    };

    //增加注入参数
    $scope.addInjectParam = function () {

        $scope.errors = [];
        if ($scope.param.switch.trim() === "") {
            $scope.errors.push({error: "开关只能是0或者1,1代表开启,0代表关闭"});
            return;
        }
        //对控制开关进行验证
        if ("01".indexOf($scope.param.switch) === -1) {
            $scope.errors.push({error: "开关只能是0或者1,1代表开启,0代表关闭"});
            return;
        }

        //检查该参数名是否存在
        var flag = false;
        angular.forEach($scope.injectParams, function (x) {
            if ($scope.param.name === x.name) {
                $scope.errors.push({error: "该参数名已存在!请修改后重新添加."});
                flag = true;
            }
        });
        if (flag) {
            return;
        }

        //检查参数的条件
        var openCondition = $scope.param.open_condition || "";
        if ($scope.param.paramtype === '0' && !checkCondition(openCondition, "公有条件")) {
            return;
        }
        var inCondition = $scope.param.in_condition || "";
        if (!checkCondition(inCondition, "私有条件")) {
            return;
        }

        restAPI.sadmin.save({
            ID: 'addInjectParam',
            OP: app.store("platform")
        }, $scope.param, function () {
            $scope.injectParams.push($scope.param);
            $("#paramInjectPanel").modal('hide');
            app.toast.success("添加成功！");
        });
    };

    //删除注入参数
    $scope.delInjectParam = function (index) {

        var param = $scope.injectParams[index];
        app.confirmDialog({
            message: "确定删除吗?(这将会把此平台下所有用户的该注入参数删除!)",
            name: "参数:" + param.name
        }, function () {
            restAPI.sadmin.save({
                ID: 'delInjectParam',
                OP: app.store("platform")
            }, param, function () {
                $scope.injectParams.splice(index, 1);
                app.toast.success("删除成功！");
            });
        }, function () {

        });

    };
}]).controller('sadminStrategyInfoCtrl', ['app', '$scope', function (app, $scope) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }
    //检测是否为超管
    if (app.store("user").pub_level === "1") {
        app.rootScope.goBack();
        return;
    }
    var restAPI = app.restAPI;
    $scope.list = [];

    restAPI.sadmin.get({
        ID: "getUserAllCampaignForAdmin",
        OP: app.store("platform")
    }, function (data) {
        $scope.campaigns = data.data;
    });

    $scope.delCampaign = function (optgroupid, index) {
        var ap = $scope.campaigns[index];
        app.confirmDialog({
            message: "您确定要删除此条数据吗？",
            name: "投放策略:" + ap.subgroup
        }, function () {
            restAPI.campaign.save({
                ID: 'delCampaign',
                optgroupid: optgroupid,
                platform: app.store("platform")
            }, {}, function () {
                $scope.campaigns.splice(index, 1);
            });
        }, function () {

        });

    };
}]).controller('sadminAdStrategyCtrl', ['app', '$scope', function (app, $scope) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }
    //检测是否为超管
    if (app.store("user").pub_level === "1") {
        app.rootScope.goBack();
        return;
    }
    var restAPI = app.restAPI;

    var options = {
        mode: 'tree',
        modes: ['code', 'form', 'text', 'tree', 'view']
    };
    var userdata;

    $scope.options = options;
    $scope.myusers = [];
    $scope.default = '0';
    $scope.isGroupShow = false;
    $scope.mystrategy = {};
    $scope.condition = {};
    $scope.pagination = {};
    $scope.condition.query = "";


    //获取广告策略
    restAPI.sadmin.save({
        ID: 'getAdStrategyForSadmin'
    }, {
        platform: app.store('platform')
    }, function (data) {
        $scope.adStrategys = data.data.adStrategys || [];
        $scope.pagination.pageSize = 15;
        $scope.pagination.totalRow = data.data.totalRow;
        $scope.pagination.pageNumber = 1;
    });

    $scope.$watch("condition.query", function (newVal, oldVal) {
        if (newVal === oldVal) {
            return;
        }

        restAPI.sadmin.save({
            ID: 'getAdStrategyForSadmin'
        }, {
            platform: app.store('platform'),
            query: $scope.condition.query
        }, function (data) {
            $scope.adStrategys = data.data.adStrategys || [];
            $scope.pagination.pageSize = 15;
            $scope.pagination.totalRow = data.data.totalRow;
            $scope.pagination.pageNumber = 1;
        });
    });

    $scope.$on('genPagination', function (event, p) {
        if (event.stopPropagation)
            event.stopPropagation();

        restAPI.sadmin.save({
            ID: 'getAdStrategyForSadmin'
        }, {
            platform: app.store('platform'),
            query: $scope.condition.query,
            pageNumber: p
        }, function (data) {
            $scope.adStrategys = data.data.adStrategys;
            $scope.pagination.totalRow = data.data.totalRow;
            $scope.pagination.pageNumber = p;
        });
    });
    //获取广告策略
    // restAPI.sadmin.get({
    //     ID: 'getAdStrategyForSadmin',
    //     OP: app.store("platform")
    // }, function (data) {
    //     $scope.adStrategys = data.data;
    // });

    //获取用户信息
    restAPI.sadmin.get({
        ID: 'getAllUserInfoGroupByCompanyName'
    }, function (data) {
        userdata = data.data;
        angular.forEach(userdata, function (x) {
            x.showName = x.company_name + "-" + x.contacts;
        });
        $scope.users = angular.copy(userdata);
    });

    //初始化超管编辑广告策略modal
    $scope.showUpdateModal = function (adStrategy, type) {
        $scope.users = angular.copy(userdata);
        $scope.adStrategyNodeType = type;
        $scope.myusers = [];
        $scope.mystrategy.value = app.union(adStrategy.value);
        $scope.newName = adStrategy.name;
        $scope.id = adStrategy._id.$oid;
        $scope.default = adStrategy.default;
        if (adStrategy.pubid.length !== 1 || adStrategy.pubid[0] !== "default") {
            $scope.users = $scope.users.filter(function (x) {
                var flag = true;
                angular.forEach(adStrategy.pubid, function (y) {
                    if (x.pubid === y) {
                        $scope.myusers.push(x);
                        flag = false;
                    }
                });
                return flag;
            });
        }
    };

    //初始化超管复制广告策略modal
    $scope.copyStrategyModal = function (adStrategy) {
        $scope.copystrategy = app.union(adStrategy);
        $scope.copystrategy.name = "";
        delete $scope.copystrategy._id;
    };


    //添加广告策略的个性化用户
    $scope.addUser = function (index) {

        var user = $scope.users[index];
        $scope.myusers.push(user);
        $scope.users.splice(index, 1);
    };

    //移除广告策略的个性化用户
    $scope.delUser = function (index) {
        var user = $scope.myusers[index];
        restAPI.sadmin.save({
            ID: 'checkAdForUser'
        }, {
            pubid: user.pubid,
            adStrategyId: $scope.id,
            platform: app.store('platform')
        }, function (data) {
            if (data.data.result) {
                $scope.myusers.splice(index, 1);
                $scope.users.push(user);
            } else {
                app.toast.info("该账号下有应用已经添加了此广告策略,请先解除关联关系");
            }
        });
    };

    $scope.updateAdStrategy = function () {
        //添加广告策略的适用用户
        var pubid = [];
        if ($scope.myusers.length === 0 || $scope.default === "1") {
            pubid.push("default");
        } else {
            angular.forEach($scope.myusers, function (x) {
                pubid.push(x.pubid);
            });
        }

        if (!($scope.mystrategy.value instanceof Object)) {
            app.toast.warning("策略不是json对象!请修改!");
            return;
        }

        restAPI.sadmin.save({
            ID: 'updateAdStrategyForSadmin',
            platform: app.store("platform")
        }, {
            value: $scope.mystrategy.value,
            newName: $scope.newName,
            adStrategyId: $scope.id,
            pubid: pubid
        }, function () {
            angular.forEach($scope.adStrategys, function (x) {
                if (x._id.$oid === $scope.id) {
                    x.value = app.union($scope.mystrategy.value);
                    x.name = $scope.newName;
                    x.pubid = pubid;
                }
            });
            $scope.mystrategy.value = {};
            if ($scope.adStrategyNodeType === 'all') {
                $('#showUpdateModal').modal('hide');
            } else {
                $('#adStrategyNodeModel').modal('hide');
            }
            app.toast.success("更新成功！");
        });
    };

    //复制用户自定义的广告策略
    $scope.copyAdStrategy = function () {

        if ($scope.copystrategy.name === "") {
            app.toast.error("请填写策略名称!");
            return;
        }

        //添加平台,优先级,默认适用于所有用户
        $scope.copystrategy.platform = app.store("platform");
        $scope.copystrategy.default = "0";
        $scope.copystrategy.pubid = [];
        $scope.copystrategy.pubid.push("default");

        restAPI.sadmin.save({
            ID: "copyAdStrategy",
            OP: app.store('platform')
        }, $scope.copystrategy, function (data) {
            $("#copyStrategyModal").modal('hide');
            app.toast.success("复制成功！");
            $scope.adStrategys.push(data.data);
        });
    };
}]).controller('sadminAddAdStrategyCtrl', ['app', '$scope', function (app, $scope) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    //检测是否为超管
    if (app.store("user").pub_level === "1") {
        app.rootScope.goBack();
        return;
    }

    var restAPI = app.restAPI;
    $scope.errors = [];
    var user = app.store("user");
    var jsonData = {},
        options = {
            mode: 'tree',
            modes: ['code', 'form', 'text', 'tree', 'view']
        };
    $scope.data = jsonData;
    $scope.options = options;
    $scope.errors = [];
    $scope.myusers = [];
    $scope.isGroupShow = false;

    //获取用户信息
    restAPI.sadmin.get({
        ID: 'getAllUserInfoGroupByCompanyName'
    }, function (data) {
        $scope.users = data.data;
        angular.forEach($scope.users, function (x) {
            x.showName = x.company_name + "-" + x.contacts;
        });
    });

    $scope.callback = function (file) {
        jsonData = JSON.parse(file.content);
        $scope.jsonfile = file;
        $scope.data = jsonData;
        $scope.isJson = ($scope.jsonfile.name.split('.')[1] === 'json');
    };

    //添加广告策略的个性化用户
    $scope.addUser = function (index) {
        var user = $scope.users[index];
        $scope.myusers.push(user);
        $scope.users.splice(index, 1);
    };

    //移除广告策略的个性化用户
    $scope.delUser = function (index) {
        var user = $scope.myusers[index];
        $scope.myusers.splice(index, 1);
        $scope.users.push(user);
    };

    $scope.submit = function () {
        $scope.errors = [];
        var isAdStrategy = true;

        //校验json，如果json格式有误，$scope.data为空对象
        var flag = true;
        angular.forEach($scope.data, function (x) {
            flag = false;
        });
        if (flag) {
            $scope.errors.push({"error": "json为空或json格式有误！请检查后重新上传json文件！"});
            isAdStrategy = false;
        }

        var data = [];
        if (angular.isArray($scope.data)) {
            data = $scope.data;
        } else if (angular.isObject($scope.data)) {
            data.push($scope.data);
        }

        //对必须有的字段进行校验
        angular.forEach(data, function (x) {
            if (x.name === undefined || x.name === null || x.name === "") {
                $scope.errors.push({"error": "请填写name字段!"});
                isAdStrategy = false;
            }
            if (!(x.value instanceof Object) || x.value instanceof Array) {
                $scope.errors.push({"error": "value字段必填,value为json对象!"});
                isAdStrategy = false;
            }
        });

        if (!isAdStrategy) {
            return;
        }

        //添加平台,广告适用的用户
        angular.forEach(data, function (x) {
            x.platform = app.store("platform");
            x.default = "0";
            x.pubid = [];
            if ($scope.myusers.length === 0) {
                x.pubid.push("default");
            } else {
                angular.forEach($scope.myusers, function (y) {
                    x.pubid.push(y.pubid);
                });
            }
        });

        restAPI.sadmin.save({
            ID: "addAdStrategy",
            OP: app.store('platform')
        }, data, function () {
            app.$state.go("sadminAdStrategy.sadminAdStrategyInfo");
        });
    };
}]).controller('sadminPrivateAdInfoCtrl', ['app', '$scope', function (app, $scope) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }
    //检测是否为超管
    if (app.store("user").pub_level === "1") {
        app.rootScope.goBack();
        return;
    }
    var restAPI = app.restAPI;

    var options = {
        mode: 'tree',
        modes: ['code', 'form', 'text', 'tree', 'view']
    };

    $scope.options = options;
    $scope.mystrategy = {};
    $scope.condition = {};
    $scope.pagination = {};
    $scope.condition.query = "";

    //获取广告策略
    restAPI.sadmin.save({
        ID: 'getPrivateAdForSadmin'
    }, {
        platform: app.store('platform')
    }, function (data) {
        $scope.adStrategys = data.data.privateStrategys || [];
        $scope.pagination.pageSize = 15;
        $scope.pagination.totalRow = data.data.totalRow;
        $scope.pagination.pageNumber = 1;
    });

    $scope.$watch("condition.query", function (newVal, oldVal) {
        if (newVal === oldVal) {
            return;
        }

        restAPI.sadmin.save({
            ID: 'getPrivateAdForSadmin'
        }, {
            platform: app.store('platform'),
            query: $scope.condition.query
        }, function (data) {
            $scope.adStrategys = data.data.privateStrategys || [];
            $scope.pagination.pageSize = 15;
            $scope.pagination.totalRow = data.data.totalRow;
            $scope.pagination.pageNumber = 1;
        });
    });

    $scope.$on('genPagination', function (event, p) {
        if (event.stopPropagation)
            event.stopPropagation();

        restAPI.sadmin.save({
            ID: 'getPrivateAdForSadmin'
        }, {
            platform: app.store('platform'),
            query: $scope.condition.query,
            pageNumber: p
        }, function (data) {
            $scope.adStrategys = data.data.privateStrategys;
            $scope.pagination.totalRow = data.data.totalRow;
            $scope.pagination.pageNumber = p;
        });
    });

    //初始化超管编辑广告策略modal
    $scope.showUpdateModal = function (adStrategy) {
        $scope.mystrategy.value = app.union(adStrategy.value);
        $scope.newName = adStrategy.name;
        $scope.id = adStrategy._id.$oid;
    };

    //初始化超管复制广告策略modal
    $scope.copyStrategyModal = function (adStrategy) {
        $scope.copystrategy = app.union(adStrategy);
        $scope.copystrategy.name = "";
        delete $scope.copystrategy._id;
    };

    $scope.updateAdStrategy = function () {

        if (!($scope.mystrategy.value instanceof Object)) {
            app.toast.warning("策略不是json对象!请修改!");
            return;
        }

        if ($scope.newName === undefined || $scope.newName === "") {
            app.toast.warning("名称不能为空！");
            return;
        }

        restAPI.sadmin.save({
            ID: 'updatePrivateAdForSadmin'
        }, {
            platform: app.store("platform"),
            value: $scope.mystrategy.value,
            newName: $scope.newName,
            adStrategyId: $scope.id
        }, function () {
            angular.forEach($scope.adStrategys, function (x) {
                if (x._id.$oid === $scope.id) {
                    x.value = app.union($scope.mystrategy.value);
                    x.name = $scope.newName;
                }
            });
            $scope.mystrategy.value = {};
            $("#showUpdateModal").modal('hide');
            app.toast.success("更新成功！");
        });
    };

    //复制用户自定义的广告策略
    /*$scope.copyAdStrategy = function () {

     if ($scope.copystrategy.name === ""){
     app.toast.error("请填写策略名称!");
     return;
     }

     //添加平台,优先级,默认适用于所有用户
     $scope.copystrategy.platform = app.store("platform");
     // $scope.copystrategy.default = "0";
     // $scope.copystrategy.pubid = [];
     // $scope.copystrategy.pubid.push("default");

     restAPI.sadmin.save({
     ID: "copyPrivateAdForSadmin",
     OP: app.store('platform')
     }, $scope.copystrategy, function(data){
     $("#copyStrategyModal").modal('hide');
     app.toast.success("复制成功！");
     $scope.adStrategys.push(data.data);
     });
     };*/

    $scope.delAdStrategy = function (index, id, name) {

        app.confirmDialog({
            message: "确定删除该策略?",
            name: "策略名称:" + name
        }, function () {
            restAPI.sadmin.save({
                ID: 'delPrivateAdForSadmin'
            }, {
                id: id
            }, function () {
                app.toast.success("删除成功！");
                $scope.adStrategys.splice(index, 1);
            });
        }, function () {

        });
    }
}]).controller('sadminPrivateAdInsertCtrl', ['app', '$scope', function (app, $scope) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    //检测是否为超管
    if (app.store("user").pub_level === "1") {
        app.rootScope.goBack();
        return;
    }

    var restAPI = app.restAPI;
    $scope.errors = [];
    var user = app.store("user");
    var jsonData = {},
        options = {
            mode: 'tree',
            modes: ['code', 'form', 'text', 'tree', 'view']
        };
    $scope.data = jsonData;
    $scope.options = options;
    $scope.errors = [];
    $scope.pubid = "";

    //获取用户信息
    restAPI.sadmin.get({
        ID: 'getAllUserInfoGroupByCompanyName'
    }, function (data) {
        $scope.users = data.data;
        angular.forEach($scope.users, function (x) {
            x.showName = x.company_name + "-" + x.contacts;
        });
    });

    $scope.callback = function (file) {
        jsonData = JSON.parse(file.content);
        $scope.jsonfile = file;
        $scope.data = jsonData;
        $scope.isJson = ($scope.jsonfile.name.split('.')[1] === 'json');
    };

    $scope.submit = function () {
        $scope.errors = [];
        var isAdStrategy = true;

        //校验json，如果json格式有误，$scope.data为空对象
        var flag = true;
        angular.forEach($scope.data, function () {
            flag = false;
        });
        if (flag) {
            $scope.errors.push({"error": "json为空或json格式有误！请检查后重新上传json文件！"});
            isAdStrategy = false;
        }

        if ($scope.pubid === undefined || $scope.pubid === "") {
            $scope.errors.push({"error": "请选择一个账户!"});
            isAdStrategy = false;
        }

        var data = [];
        var temp = angular.copy($scope.data);
        if (angular.isArray($scope.data)) {
            data = temp;
        } else if (angular.isObject($scope.data)) {
            data.push(temp);
        }

        //对必须有的字段进行校验
        angular.forEach(data, function (x, m) {
            if (x.name === undefined || x.name === null || x.name === "") {
                $scope.errors.push({"error": "请填写name字段!"});
                isAdStrategy = false;
            }

            if (data.length > 1) {
                angular.forEach(data, function (y, n) {
                    if (m !== n && x.name === y.name) {
                        $scope.errors.push({"error": "填写的策略名有重复，请检查!"});
                        isAdStrategy = false;
                    }
                });
            }

            if (!(x.value instanceof Object) || x.value instanceof Array) {
                $scope.errors.push({"error": "value字段必填,value为json对象!"});
                isAdStrategy = false;
            }
        });

        if (!isAdStrategy) {
            return;
        }

        //添加平台,广告适用的用户
        angular.forEach(data, function (x) {
            x.platform = app.store("platform");
            //创建者
            x.creator = "超管";
            //适用的用户
            x.pubid = $scope.pubid;
            angular.forEach($scope.users, function (y) {
                if (y.pubid === $scope.pubid) {
                    x.accountname = y.showName;
                }
            });
        });

        restAPI.sadmin.save({
            ID: "addPrivateAdForSadmin"
        }, data, function () {
            app.$state.go("sadminPrivateAd.sadminPrivateAdInfo");
        });
    };
}]).controller('sadminUserInfoCtrl', ['app', '$scope', function (app, $scope) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    //检测是否为超管
    if (app.store("user").pub_level === "1") {
        app.rootScope.goBack();
        returnT;
    }

    var restAPI = app.restAPI;

    //获取用户信息
    restAPI.sadmin.get({
        ID: 'getAllUserInfo'
    }, function (data) {
        $scope.users = data.data;
    });

    //跳转到子账户
    $scope.switchToSubAccount = function (pubid) {

        restAPI.user.get({
            ID: 'switchToSubAccount',
            pubid: app.store("user").pubid,
            subPubid: pubid
        }, function (data) {
            app.store("user", data.data);
            app.$state.go('index.appBascInfo');
        });
    };

    //重置用户的密码
    $scope.resetPassword = function (pubid, name) {
        app.confirmDialog({
            message: "确定重置该用户的密码?",
            name: "用户邮箱:" + name
        }, function () {
            restAPI.user.save({
                ID: 'resetPassword'
            }, {
                pubid: pubid
            }, function () {
                app.toast.success("密码重置成功!");
            });
        }, function () {

        });
    };

    //设置用户广告权限(是否开放自定义的广告权限)
    $scope.setAdAuth = function (index, adAuth) {
        var user = $scope.users[index];
        var desc = "开放";
        if (adAuth === "1") {
            desc = "";
        } else {
            desc = "关闭";
        }
        app.confirmDialog({
            message: "确定" + desc + "该用户的自定义广告权限?",
            name: "用户邮箱:" + user.login_id
        }, function () {
            restAPI.user.save({
                ID: 'setAdAuth'
            }, {
                pubid: user.pubid,
                adAuth: adAuth
            }, function () {
                user.adAuth = adAuth;
                app.toast.success("操作成功!");
            });
        }, function () {
        });
    };

    //设置用户部分广告权限(是否开放自定义的广告权限的部分权限)
    $scope.setAdPartAuth = function (index, adPartAuth) {
        var user = $scope.users[index];
        var desc = "";
        if (adPartAuth === "1") {
            desc = "开放";
        } else {
            desc = "关闭";
        }

        app.confirmDialog({
            message: "确定" + desc + "该用户的部分自定义广告权限?",
            name: "用户邮箱:" + user.login_id
        }, function () {
            restAPI.user.save({
                ID: 'setAdPartAuth'
            }, {
                pubid: user.pubid,
                adPartAuth: adPartAuth
            }, function () {
                user.adPartAuth = adPartAuth;
                app.toast.success("操作成功!");
            });
        }, function () {
        });
    };

    //设置用户定时任务权限
    $scope.setTimingTaskAuth = function (index, timingTaskAuth) {
        var user = $scope.users[index];
        var desc = "";
        if (timingTaskAuth === "1") {
            desc = "开放";
        } else {
            desc = "关闭";
        }

        app.confirmDialog({
            message: "确定" + desc + "该用户的定时任务权限?",
            name: "用户邮箱:" + user.login_id
        }, function () {
            restAPI.user.save({
                ID: 'setTimingTaskAuth'
            }, {
                pubid: user.pubid,
                timingTaskAuth: timingTaskAuth
            }, function () {
                user.timingTaskAuth = timingTaskAuth;
                app.toast.success("操作成功!");
            });
        }, function () {
        });
    };

    $scope.showModel = function (user) {
        $scope.user = user;
    };

    $scope.submit = function () {
        var data = {
            "pubid": $scope.user.pubid,
            "state": $scope.user.state,
            "company_name": $scope.user.company_name,
            "domain_name": $scope.user.domain_name,
            "interior": $scope.user.interior
        };

        restAPI.sadmin.save({
            ID: "setUserState"
        }, data, function () {
            $('#setUserState').modal('hide');
            app.toast.success("操作成功!");
        });
    };

}]).controller('sadminGeoextCtrl', ['app', '$scope', function (app, $scope) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    //检测是否为超管
    if (app.store("user").pub_level === "1") {
        app.rootScope.goBack();
        return;
    }

    var restAPI = app.restAPI;
    $scope.myRegions = [];

    restAPI.sys.get({
        ID: 'listGeo'
    }, function (data) {
        $scope.geoInfos = data.data;

        restAPI.sys.get({
            ID: 'listGeoext'
        }, function (data) {
            $scope.geoextInfos = data.data;
            angular.forEach($scope.geoextInfos, function (x) {
                x.chinesegeo = [];
                angular.forEach(x.geo, function (y) {
                    angular.forEach($scope.geoInfos, function (z) {
                        if (y === z.code) {
                            x.chinesegeo.push(z.name);
                        }
                    });
                });
            });
        });
    });

    $scope.showUpdateModel = function (region) {
        $scope.myRegions = [];
        $scope.oldRegion = region;
        angular.forEach($scope.geoInfos, function (x) {
            x.checked = false;
            angular.forEach(region.geo, function (y) {
                if (x.code === y) {
                    $scope.myRegions.push(y);
                    x.checked = true;
                }
            });
        });
    };

    $scope.showAddModel = function () {
        $scope.myRegions = [];
        $scope.newRegion = {};
        $scope.newRegion.name = "";
        $scope.newRegion.code = "";
        $scope.newRegion.geo = [];
        angular.forEach($scope.geoInfos, function (x) {
            x.checked = false;
        });
    };

    $scope.addRegionToOwn = function (region) {
        if (region.checked) {
            angular.forEach($scope.myRegions, function (x, m) {
                if (x === region.code) {
                    $scope.myRegions.splice(m, 1);
                }
            });

        } else {
            $scope.myRegions.push(region.code);
        }
        region.checked = !region.checked;
    };

    //删除地区
    $scope.delRegion = function (index) {
        var region = $scope.geoextInfos[index];
        app.confirmDialog({
            message: "您确定要删除此条数据吗？",
            name: "地区:" + region.name,
        }, function () {
            restAPI.sys.save({
                ID: 'delRegion'
            }, region, function () {
                $scope.geoextInfos.splice(index, 1);
            });
        }, function () {

        });
    };

    //更新地区信息
    $scope.updateRegion = function () {

        restAPI.sys.save({
            ID: 'updateRegion'
        }, {
            code: $scope.oldRegion.code,
            oldGeo: $scope.oldRegion.geo,
            newGeo: $scope.myRegions
        }, function () {
            $scope.oldRegion.geo = $scope.myRegions;
            $scope.oldRegion.chinesegeo = [];
            angular.forEach($scope.oldRegion.geo, function (y) {
                angular.forEach($scope.geoInfos, function (z) {
                    if (y === z.code) {
                        $scope.oldRegion.chinesegeo.push(z.name);
                    }
                });
            });
        });
    };

    //新增地区
    $scope.addRegion = function () {
        $scope.newRegion.geo = $scope.myRegions;

        //标识地区代码是否已经存在
        var flag = false;
        angular.forEach($scope.geoextInfos, function (x) {
            if ($scope.newRegion.code === x.code) {
                flag = true;
            }
        });

        if (flag) {
            app.toast.warning("地区代码已存在！");
            return;
        }

        restAPI.sys.save({
            ID: 'addRegion'
        }, $scope.newRegion, function () {
            $scope.newRegion.chinesegeo = [];
            angular.forEach($scope.newRegion.geo, function (y) {
                angular.forEach($scope.geoInfos, function (z) {
                    if (y === z.code) {
                        $scope.newRegion.chinesegeo.push(z.name);
                    }
                });
            });
            $scope.geoextInfos.push($scope.newRegion);
        });
    };
}]).controller('sadminMarketCtrl', ['app', '$scope', function (app, $scope) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    //检测是否为超管
    if (app.store("user").pub_level === "1") {
        app.rootScope.goBack();
        return;
    }

    var restAPI = app.restAPI;

    //获取市场信息
    restAPI.sys.get({
        ID: 'listMarket',
        OP: app.store("platform")
    }, function (data) {
        $scope.markets = data.data;
    });

    //打开增加市场model
    $scope.showAddModel = function () {
        $scope.newMarket = {};
    };

    //打开更新市场model
    $scope.showUpdateModel = function (market) {
        $scope.oldMarket = market;
    };

    //增加市场
    $scope.addMarket = function () {
        //标识地区代码是否已经存在
        var flag = false;
        angular.forEach($scope.markets, function (x) {
            if ($scope.newMarket.name === x.name) {
                flag = true;
            }
        });

        if (flag) {
            app.toast.warning("该市场已存在！");
            return;
        }
        restAPI.sys.save({
            ID: 'addMarket',
            OP: app.store("platform")
        }, $scope.newMarket, function (data) {
            $scope.markets.push(data.data);
            app.toast.success("添加成功！");
        });
    };

    //更新市场
    $scope.updateMarket = function () {
        restAPI.sys.save({
            ID: 'updateMarket'
        }, $scope.oldMarket, function () {
            app.toast.success("更新成功！");
        });
    };

    //删除市场
    $scope.delMarket = function (index) {
        var market = $scope.markets[index];

        app.confirmDialog({
            message: "您确定要删除此条数据吗？",
            name: "市场:" + market.name,
        }, function () {
            restAPI.sys.get({
                ID: 'delMarket',
                OP: market.name
            }, function () {
                $scope.markets.splice(index, 1);
                app.toast.success("删除成功！");
            });
        }, function () {
        });
    };
}]).controller('sadminSynCtrl', ['app', '$scope', '$resource', function (app, $scope, $resource) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    //检测是否为超管
    if (app.store("user").pub_level === "1") {
        app.rootScope.goBack();
        return;
    }

    var restAPI = app.restAPI;
    var timePromise = "yanshi";
    var delaytime = 120;

    $scope.list = [];
    $scope.upload = false;
    $scope.showDelaytime = false;

    $scope.setDelay = function (time) {
        $scope.second = time;
        timePromise = $interval(function () {
            if ($scope.second <= 0) {
                $interval.cancel(timePromise);
                if (delaytime > 15) {
                    delaytime = delaytime / 2;
                } else if (delaytime > 10) {
                    delaytime = delaytime - 5;
                }
                app.toast.info("自动刷新!");
                $scope.updateSynInfo();
                $scope.upload = true;
            } else {
                $scope.second--;
            }
        }, 1000, time + 1);
    };

    $scope.updateSynInfo = function () {
        $scope.showDelaytime = true;
        restAPI.sys.get({
            ID: 'getPublishInfoForAdmin',
            platform: app.store('platform')
        }, function (data) {
            $scope.list = data.data.info;

            if (!data.data.success) {
                if (timePromise !== undefined) {
                    $scope.setDelay(delaytime);
                }
                app.toast.info("发布未完成,请耐心等待!");
            } else {
                timePromise = undefined;
                $scope.showDelaytime = false;
                app.toast.info("发布完成!");
            }
        });
    };

    $scope.showModel = function () {
        $scope.errors = [];
    };

    //发布平台下所有应用
    $scope.syn = function () {
        $scope.errors = [];
        $scope.errorShow = false;

        $scope.reason = $scope.reason.trim();
        if ($scope.reason.length < 5) {

            $scope.errorShow = true;
            $scope.errors.push({error: "发布原因描述不能少于10个字符"});
            return;
        }

        var data = {platform: app.store("platform"), reason: $scope.reason, pubType: "2"};

        restAPI.sys.save({
            ID: 'publishForAdmin'
        }, data, function (data) {
            if (data.data.result) {
                app.timeout(function () {
                    $scope.updateSynInfo();
                }, 1 * 1000);
                $('#appSyn').modal('hide');
            } else {
                app.toast.info("发布失败！");
            }
        });
    };

    $scope.newSynInfo = function () {
        restAPI.sys.get({
            ID: 'getPublishInfoForAdmin',
            platform: app.store('platform')
        }, function (data) {
            $scope.list = data.data.info;

            if (!data.data.success) {
                app.toast.info("发布未完成,请耐心等待!");
            } else {
                if (timePromise !== undefined) {
                    $interval.cancel(timePromise);
                    timePromise = undefined;
                    $scope.upload = false;
                    $scope.showDelaytime = false;
                }

                app.toast.info("发布完成!");
            }
        });
    };

    /**
     * by jiananzhao
     */
    $scope.initAppCache = function () {
        $resource("/admin/api/bomb/initAppCache").get({}, function (response) {
            window.alert("正在处理，请勿再次点击此链接...");
        });
    };
    $scope.initAppId = function () {
        $resource("/admin/api/bomb/initAppId").get({}, function (response) {
            window.alert("正在初始化，千万别再点击啦...");
        });
    }
}]).controller('sadminNoticeInfoCtrl', ['app', '$scope', function (app, $scope) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    var restAPI = app.restAPI;
    $scope.selectAllFlag = false;
    $scope.users = [];
    $scope.errors = [];

    $scope.pagination = {};

    //获取所有系统通知
    restAPI.notice.save({
        ID: 'getNoticeInfo'
    }, {
        platform: app.store('platform')
    }, function (data) {
        $scope.infos = data.data.noticeInfos;
        $scope.pagination.pageSize = 15;
        $scope.pagination.totalRow = data.data.totalRow;
        $scope.pagination.pageNumber = 1;
    });

    //获取所有用户信息
    restAPI.user.get({
        ID: 'getAllUserInfoForAdmin'
    }, function (data) {
        $scope.users = data.data;
        /*angular.forEach($scope.users, function (x) {
         x.checked = false;
         });*/
    });

    $scope.$on('genPagination', function (event, p) {
        if (event.stopPropagation)
            event.stopPropagation();

        restAPI.notice.save({
            ID: 'getNoticeInfo'
        }, {
            platform: app.store('platform'),
            pageNumber: p
        }, function (data) {
            $scope.infos = data.data.noticeInfos;
            $scope.pagination.totalRow = data.data.totalRow;
            $scope.pagination.pageNumber = p;
        });
    });

    $scope.addNoticeInfoModal = function () {
        $scope.myUsers = [];
        $scope.showInfo = {};
        $scope.isAddNewInfo = true;
    };

    $scope.showNoticeInfoModal = function (index) {
        $scope.myUsers = [];
        $scope.showInfo = $scope.infos[index];
        $scope.isAddNewInfo = false;
    };

    $scope.addToMe = function (user) {

        if (user.checked) {
            $scope.myUsers = $scope.myUsers.filter(function (x) {
                return x.pubid !== user.pubid;
            });
            user.checked = !user.checked;
        } else {
            user.checked = !user.checked;
            $scope.myUsers.push({pubid: user.pubid});
        }
    };

    $scope.selectAll = function () {
        $scope.myUsers = [];

        if ($scope.selectAllFlag) {
            angular.forEach($scope.users, function (x) {
                x.checked = false;
            });
        } else {
            angular.forEach($scope.user, function (x) {
                $scope.myUsers.push({pubid: x.pubid});
                x.checked = true;
            });
        }

        $scope.selectAllFlag = !$scope.selectAllFlag;
    };

    //新增系统消息并发送邮件
    $scope.addNoticeInfo = function () {
        restAPI.notice.save({
            ID: 'addNoticeInfo'
        }, {
            noticeInfo: $scope.showInfo,
            users: $scope.users,
            platform: app.store('platform')
        }, function (data) {
            app.toast.info("新增成功!");
            $scope.infos.push(data.data);
            $('#editNoticeInfo').modal('hide');
        }, function () {
            app.toast.error("新增失败!");
        });
    };

    //发送邮件
    $scope.sendMail = function () {
        restAPI.notice.save({
            ID: 'sendMail'
        }, {
            noticeInfo: $scope.showInfo,
            users: $scope.users,
            platform: app.store('platform')
        }, function (data) {
            app.toast.info("新增成功!");
            $scope.infos.push(data.data);
            $('#editNoticeInfo').modal.hide();
        }, function () {
            app.toast.error("新增失败!");
        });
    };

    $scope.delNoticeInfo = function (id, index) {
        restAPI.notice.save({
            ID: 'delNoticeInfo'
        }, {
            id: id,
            users: $scope.users
        }, function () {
            app.toast.info("删除成功!");
            app.timeout(function () {
                window.location.reload(true);
            }, 500);
        });
    };
}]).controller('userLoginCtrl', ['app', '$scope', '$cookieStore', '$state', function (app, $scope, $cookieStore, $state) {

    app.clearUser();
    app.rootScope.global.title = app.locale.USER.login;
    $scope.$state = $state;

    var locale = app.locale,
        global = app.rootScope.global;
    global.title = locale.USER.register;

    $scope.reset = {
        title: '',
        type: ''
    };

    //记住用户
    var u = $cookieStore.get("u");
    if (!!u) {
        $scope.login = {
            remember: true,
            logname: u,
            logpwd: ''
        };
    } else {
        $scope.login = {
            remember: false,
            logname: '',
            logpwd: ''
        };
    }

    //注册新用户
    $scope.user = {
        login_id: '',
        contacts: '',
        telephone: '',
        company_name: '',
        password: '',
        password2: ''
    };
    $scope.opRegDisable = true;

    $scope.checkName = function (scope, model) {
        return app.filter('checkName')(model.$value);
    };

    $scope.checkEmail = function (scope, model) {
        return app.filter('checkEmail')(model.$value);
    };

    $scope.checkTel = function (scope, model) {
        return app.filter('checkTel')(model.$value);
    };

    $scope.loginSubmit = function () {

        // if (app.validate($scope)) {

        var data = app.union($scope.login);
        data.logtime = Date.now() - app.timeOffset;
        data.logpwd = app.CryptoJS.SHA256(data.logpwd).toString();
        data.logpwd = app.CryptoJS.HmacSHA256(data.logpwd, 'blueshocks').toString();
        data.logpwd = app.CryptoJS.HmacSHA256(data.logpwd, data.logname + ':' + data.logtime).toString();

        app.rootScope.global.user = data.data;

        if (!!$scope.login.remember) {
            $cookieStore.put("u", data.data.login_id);
        } else {
            $cookieStore.remove("u");
        }

        console.log(app.$state);
        app.$state.go('index.showAppBascInfo');

        // app.restAPI.user.save({
        //     ID: 'login'
        // }, data, function (data) {
        //     if (data.data.state === "1") {
        //         app.toast.error("此账号被冻结!无法使用.");
        //         return;
        //     }
        //     app.rootScope.global.user = data.data;
        //
        //     if (!!$scope.login.remember) {
        //         $cookieStore.put("u", data.data.login_id);
        //     } else {
        //         $cookieStore.remove("u");
        //     }
        //
        //     app.store('user', data.data);
        //     $scope.platform = "1";
        //     app.store('platform', $scope.platform);
        //     app.checkUser();
        //     $scope.$destroy();
        //     if (app.rootScope.global.user.pub_level === "0") {
        //         app.$state.go('sadminNotice.info');
        //     } else {
        //         if (data.data.subpubid === null || data.data.subpubid === undefined) {
        //             app.$state.go('dashboard.index');
        //         } else {
        //             app.$state.go('index.showAppBascInfo');
        //         }
        //     }
        // }, function (data) {
        //     $scope.reset.type = data.msg.name;
        //     $scope.reset.title = app.locale.RESET[data.msg.name];
        // });
        // }
    };

    $scope.registerSubmit = function () {
        var user = $scope.user;
        if ($scope.opRegDisable && app.validate($scope)) {
            $scope.opRegDisable = false;
            var data = {
                login_id: user.login_id,
                contacts: user.contacts,
                telephone: user.telephone,
                company_name: user.company_name
            };
            data.password = app.CryptoJS.SHA256(user.password).toString();
            data.password = app.CryptoJS.HmacSHA256(data.password, 'blueshocks').toString();

            app.restAPI.user.save({
                ID: 'register'
            }, data, function (data) {
                app.rootScope.global.user = data.data;
                app.store('user', data.data);
                app.checkUser();
                //$scope.$destroy();
                app.toast.success(3 + locale.TIMING.goLogin, locale.USER.registerOK);
                $cookieStore.put("u", data.data.login_id);

                app.timing(null, 1000, 3).then(function () {
                    app.$state.go("login");
                });
            }, function () {
                app.toast.info("注册失败!");
                $scope.opRegDisable = true;
            });
        }
    };
}
]).controller('userSetingCtrl', ['app', '$scope', function (app, $scope) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }
    var locale = app.locale;
    var restAPI = app.restAPI;
    var user = app.store('user');
    if (user.subpubid !== null && angular.isDefined(user.subpubid)) {
        app.restAPI.user.get({
            ID: 'getSubAccountJurisdiction',
            OP: user.subpubid
        }, function (data) {
            if (data.data !== null) {
                $scope.userPasSet = {
                    logname: data.data.login_id,
                    logpwd: '',
                    restpwd: ''
                };
            }
        });
    } else {
        $scope.userPasSet = {
            logname: user.login_id,
            logpwd: '',
            restpwd: ''
        };
    }

    $scope.submit = function () {

        if (app.validate($scope)) {

            var data = app.union($scope.userPasSet);
            if (data.logpwd === data.restpwd) {
                app.toast.warning("原密码和重置的密码重复!");
                return;
            }

            data.logtime = Date.now() - app.timeOffset;
            data.logpwd = app.CryptoJS.SHA256(data.logpwd).toString();
            data.logpwd = app.CryptoJS.HmacSHA256(data.logpwd, 'blueshocks').toString();
            data.logpwd = app.CryptoJS.HmacSHA256(data.logpwd, data.logname + ':' + data.logtime).toString();
            data.restpwd = app.CryptoJS.SHA256(data.restpwd).toString();
            data.restpwd = app.CryptoJS.HmacSHA256(data.restpwd, 'blueshocks').toString();

            restAPI.user.save({
                ID: 'uptUserPwd'
            }, data, function () {
                app.toast.success(locale.USER.updatePwdOK);
                app.$state.go('login');
            }, function () {
                app.toast.error("修改密码失败!");
            });
        }
    };
}]).controller('actionLogCtrl', ['app', '$scope', function (app, $scope) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    var restAPI = app.restAPI;
    $scope.pagination = {};
    $scope.search = {login_id: "", stime: "", etime: ""};

    //记录日志的类型
    if (app.$state.includes('log.logSyn')) {
        $scope.logType = "syn";
    } else if (app.$state.includes('sadminLog.sadminLogSyn')) {
        $scope.logType = "syn";
    } else if (app.$state.includes('sadminLog.sadminLogLoginIn')) {
        $scope.logType = "login";
    } else if (app.$state.includes('sadminLog.sadminLogApp')) {
        $scope.logType = "app";
    } else if (app.$state.includes('sadminLog.sadminLogOpt')) {
        $scope.logType = "campaign";
    } else if (app.$state.includes('sadminLog.sadminLogAd')) {
        $scope.logType = "ad";
    } else {
        $scope.logType = "";
    }

    restAPI.log.save({
        ID: 'getLogsInPage'
    }, {
        platform: app.store("platform"),
        logType: $scope.logType
    }, function (data) {
        $scope.logs = data.data.logs;
        $scope.pagination.pageSize = 15;
        $scope.pagination.totalRow = data.data.totalRow;
        $scope.pagination.pageNumber = 1;
    });

    $('#reservation').daterangepicker(null, function (start, end, label) {
        $scope.$apply(function () {
            var startDate = new Date(start);
            $scope.search.stime = startDate.getFullYear() + "-" + (startDate.getMonth() + 1) + "-" + startDate.getDate() + " 00:00:00";
            var endDate = new Date(end);
            $scope.search.etime = endDate.getFullYear() + "-" + (endDate.getMonth() + 1) + "-" + endDate.getDate() + " 23:59:59";
        });
    });

    $scope.$watch("search", function (newVal, oldVal) {
        if (newVal === oldVal) {
            return;
        }
        restAPI.log.save({
            ID: 'getLogsInPage'
        }, {
            platform: app.store("platform"),
            logType: $scope.logType,
            stime: $scope.search.stime,
            etime: $scope.search.etime,
            loginID: $scope.search.login_id,
            accountType: $scope.search.accountType
        }, function (data) {
            $scope.logs = data.data.logs;
            $scope.pagination.pageSize = 15;
            $scope.pagination.totalRow = data.data.totalRow;
            $scope.pagination.pageNumber = 1;
        });
    }, true);

    $scope.$on('genPagination', function (event, p) {
        if (event.stopPropagation)
            event.stopPropagation();
        restAPI.log.save({
            ID: 'getLogsInPage'
        }, {
            platform: app.store("platform"),
            logType: $scope.logType,
            stime: $scope.search.stime,
            etime: $scope.search.etime,
            loginID: $scope.search.login_id,
            accountType: $scope.search.accountType,
            pageNumber: p
        }, function (data) {
            $scope.logs = data.data.logs;
            $scope.pagination.pageSize = 15;
            $scope.pagination.totalRow = data.data.totalRow;
            $scope.pagination.pageNumber = p;
        });
    });

    $scope.exportExcel = function () {
        app.confirmDialog({
            message: "",
            name: "确定导出吗?"
        }, function () {
            if ($scope.search.accountType === undefined) {
                $scope.search.accountType = "";
            }
            var url = "/admin/api/log/exportExcel?platform="
                + app.store("platform") + "&stime=" + $scope.search.stime
                + "&etime=" + $scope.search.etime + "&loginID="
                + $scope.search.login_id + "&accountType=" + $scope.search.accountType;
            window.open(url);
        }, function () {
        });

    };

    /*$scope.exportExcel = function () {
        restAPI.log.save({
            ID: 'exportExcel'
        }, {
            platform: app.store("platform"),
            logType: $scope.logType,
            stime: $scope.search.stime,
            etime: $scope.search.etime,
            loginID: $scope.search.login_id,
            accountType: $scope.search.accountType,
        }, function (data) {
        });
    };*/
}]).controller('testAppCtrl', ["$scope", "app", function ($scope, app) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    var restAPI = app.restAPI;
    restAPI.app.get({
        ID: 'getAppTestId',
        OP: app.store('platform')
    }, function (data) {
        if (data.data !== null) {
            $scope.appTestIds = data.data;
        } else {
            $scope.appTestIds = [];
        }
    });

    $scope.appTest = {};

    //打开新增testid的modal
    $scope.showAddAppTestIdModal = function () {
        $scope.isAddFalg = true;
        $scope.appTest.desc = "";
        $scope.appTest.id = "";
        $scope.appTest.switch = "0";
    };

    //打开编辑testid的modal
    $scope.showEditAppTestIdModal = function (apptest) {
        $scope.isAddFalg = false;
        $scope.appTest = angular.copy(apptest);
        $scope.index = $scope.appTestIds.indexOf(apptest);
    };

    //新增apptestid
    $scope.addAppTestId = function () {

        if ($scope.appTestIds.length > 50) {
            app.toast.error("测试id不能超过50个!");
            return;
        }

        if (angular.isUndefined($scope.appTest.id) || $scope.appTest.id === "") {
            app.toast.error("id不能为空!");
            return;
        }

        if ("01".indexOf($scope.appTest.switch) == -1) {
            app.toast.error("开关型只能是0或者1");
            return;
        }

        restAPI.app.save({
            ID: 'addAppTestId',
            OP: app.store('platform')
        }, $scope.appTest, function (data) {
            app.toast.info("新增成功!");
            $('#testIdPanel').modal('hide');
            $scope.appTestIds = data.data;
        });
    };

    //修改apptestid
    $scope.changeAppTestId = function () {
        if (angular.isUndefined($scope.appTest.id) || $scope.appTest.id === "") {
            app.toast.error("id不能为空!");
            return;
        }

        if ("01".indexOf($scope.appTest.switch) == -1) {
            app.toast.error("开关型只能是0或者1");
            return;
        }

        restAPI.app.save({
            ID: 'changeAppTestId',
            platform: app.store('platform'),
            index: $scope.index
        }, $scope.appTest, function () {
            app.toast.info("修改成功!");
            $('#testIdPanel').modal('hide');
            $scope.appTestIds[$scope.index].switch = $scope.appTest.switch;
            $scope.appTestIds[$scope.index].id = $scope.appTest.id;
            $scope.appTestIds[$scope.index].desc = $scope.appTest.desc;
        });
    };

    //删除apptestid
    $scope.delAppTestId = function (index) {
        var apptest = $scope.appTestIds[index];
        restAPI.app.save({
            ID: 'delAppTestId',
            OP: app.store('platform')
        }, apptest, function () {
            $scope.appTestIds.splice(index, 1);
            app.toast.info("删除成功!");
        });
    };
}]).controller("testAppPubCtrl", ['app', '$scope', function (app, $scope) {

    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }
    var restAPI = app.restAPI,
        user = app.store("user");

    $scope.myapps = [];
    $scope.list = [];
    $scope.pubType = "1";
    $scope.isSelectLinkid = false;
    $scope.reason = "";
    $scope.pagination = {};
    $scope.search = {linkid: "", mark: ""};

    //获取所有APP
    restAPI.app.get({
        ID: 'getUserAllAppkey',
        OP: app.store('platform')
    }, function (data) {

        $scope.data = app.union(data.data);
        $scope.apps = app.union(data.data);
        $scope.appList = $scope.apps.slice(0, 15);
        angular.forEach($scope.apps, function (x) {
            x.isSelect = false;
        });
        $scope.pagination.totalRow = $scope.apps.length;
        $scope.pagination.pageSize = 15;
        $scope.pagination.pageNumber = 1;
    });

    //获取用户所有应用分组
    restAPI.app.get({
        ID: 'getUserAllLinkid',
        OP: app.store('platform')
    }, function (data) {
        $scope.linkids = data.data;
    });

    //监控linkid变化
    $scope.$watch(function () {
        return $scope.search;
    }, function (newVal, oldVal) {
        if (newVal === oldVal) {
            return;
        }
        if ($scope.search.mark === "" && ($scope.search.linkid === "" || $scope.search.linkid == null)) {
            $scope.apps = app.union($scope.data);
        } else if ($scope.search.mark === "") {
            $scope.apps = $scope.data.filter(function (x) {
                return x.linkid === $scope.search.linkid;
            });
        } else if ($scope.search.linkid === "" || $scope.search.linkid == null) {
            $scope.apps = $scope.data.filter(function (x) {
                return x.mark === $scope.search.mark;
            });
        } else {
            $scope.apps = $scope.data.filter(function (x) {
                return x.linkid === $scope.search.linkid && x.mark === $scope.search.mark;
            });
        }

        $scope.appList = $scope.apps.slice(0, 15);
        $scope.pagination.totalRow = $scope.apps.length;
        $scope.pagination.pageNumber = 1;

        angular.forEach($scope.apps, function (x) {
            x.isSelect = false;
        });
        $scope.isSelectLinkid = false;
    }, true);

    //监控分页变化
    $scope.$on('genPagination', function (event, p) {
        if (event.stopPropagation)
            event.stopPropagation();

        $scope.appList = $scope.apps.slice(15 * (p - 1), 15 * p);
        $scope.pagination.pageNumber = p;
    });

    //选择分组内所有app,若是所有分组,则选中所有app
    $scope.selectLinkid = function () {
        $scope.myapps = [];
        if ($scope.isSelectLinkid) {
            angular.forEach($scope.apps, function (x) {
                x.isSelect = false;
            });
        } else {
            angular.forEach($scope.apps, function (x) {
                $scope.myapps.push(x);
                x.isSelect = true;
            });
        }
        $scope.isSelectLinkid = !$scope.isSelectLinkid;
    };

    $scope.selectApp = function (index) {
        var app = $scope.appList[index];
        if (app.isSelect) {
            $scope.myapps = $scope.myapps.filter(function (x) {
                return x.appkey !== app.appkey;
            });
        } else {
            $scope.myapps.push(app);
        }
        app.isSelect = !app.isSelect;
    };

    //通知cdn更新
    $scope.syn = function () {
        $scope.errors = [];
        $scope.errorShow = false;
        if ($scope.myapps.length === 0) {
            $scope.errorShow = true;
            $scope.errors.push({error: "请选择app！"});
            return;
        }

        $scope.reason = $scope.reason.trim();
        if ($scope.reason.length < 5) {

            $scope.errorShow = true;
            $scope.errors.push({error: "发布原因描述不能少于10个字符"});
            return;
        }

        // if($scope.myapps.length === $scope.data.length){
        //     $scope.pubType = "2";
        // }

        var appkeys = "";
        angular.forEach($scope.myapps, function (x) {
            appkeys = appkeys + x.appkey + ",";
        });

        appkeys = appkeys.substring(0, appkeys.lastIndexOf(","));

        var data = {platform: app.store("platform"), pubType: $scope.pubType, appkeys: appkeys, reason: $scope.reason};

        restAPI.sys.save({
            ID: 'appSyn'
        }, data, function (data) {
            if (data.data.result) {

                //初始化操作状态
                $scope.myapps = [];
                angular.forEach($scope.apps, function (x) {
                    x.isSelect = false;
                });
                $scope.isSelectLinkid = false;
                //开放刷新发布按钮
                $scope.upload = true;
                $('#appSyn').modal('hide');
            } else {
                app.toast.info("发布失败！");
            }
        });
    };

    $scope.showModal = function () {
        $scope.errors = [];
    };
}]).controller('confirmController', ['$scope', 'close', function ($scope, close) {
    $scope.close = function (result) {
        close(result, 500); // close, but give 500ms for bootstrap to animate
    };
}]).controller('statisticsInfoCtrl', ['app', '$scope', function (app, $scope) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    var restAPI = app.restAPI;

    restAPI.statistics.get({
        ID: 'getPubidReportData',
        OP: app.store("platform"),
        pubid: app.store("user").pubid
    }, function (data) {
        $scope.userInfo = data.data[0];
        $scope.$watch("company_name", function (newVal, oldVal) {
            if (newVal === oldVal) {
                return;
            }
            app.store("statisticPubid", newVal);
            restAPI.statistics.get({
                ID: 'getPubidReportData',
                OP: app.store("platform"),
                pubid: newVal
            }, function (data) {
                $scope.userInfo = data.data[0];
            });
        });
    });
}]).controller('basicStatisticsInfoCtrl', ['app', '$scope', function (app, $scope) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    //检测是否为超管
    if (app.store("user").pub_level === "1") {
        app.rootScope.goBack();
        return;
    }

    var pubid = app.store("statisticPubid");
    var restAPI = app.restAPI;

    //超管获取统计概况
    restAPI.statistics.get({
        ID: 'getUsers'
    }, function (data) {
        $scope.usersData = data.data;
        if (angular.isUndefined(pubid) || pubid === null) {
            $scope.company_name = $scope.usersData[0].pubid;
            app.store("statisticPubid", $scope.company_name);
        } else {
            $scope.company_name = pubid;
        }
        restAPI.statistics.get({
            ID: 'getPubidReportData',
            OP: app.store("platform"),
            pubid: $scope.company_name
        }, function (data) {
            $scope.userInfo = data.data[0];
            $scope.$watch("company_name", function (newVal, oldVal) {
                if (newVal === oldVal) {
                    return;
                }
                app.store("statisticPubid", newVal);
                restAPI.statistics.get({
                    ID: 'getPubidReportData',
                    OP: app.store("platform"),
                    pubid: newVal
                }, function (data) {
                    $scope.userInfo = data.data[0];
                });
            });
        });
    });
}]).controller('sadminStatisticsCtrl', ['app', '$scope', '$stateParams', 'GetDateStr', 'highchartsDefaultOptions', 'Highcharts', 'Excel', '$timeout', function (app, $scope, $stateParams, GetDateStr, highchartsDefaultOptions, Highcharts, Excel, $timeout) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    //检测是否为超管
    if (app.store("user").pub_level === "1") {
        app.rootScope.goBack();
        return;
    }

    var adtype = $stateParams.adtype;
    if (adtype !== "pic") {
        $scope.queryDate = "3";
    } else {
        $scope.queryDate = "1";
    }

    var pubid = app.store("statisticPubid");
    var restAPI = app.restAPI,
        // categoriesArray = [GetDateStr(6), GetDateStr(5), GetDateStr(4), GetDateStr(3), GetDateStr(2), GetDateStr(1),GetDateStr(0)],
        highchartsOptions = highchartsDefaultOptions();
    //type表示是否是实时(按小时区分),moreOfferType代表是more还是积分墙,adtype代表的是广告类型如banner,icon,push等.
    $scope.condition = {
        pname: '',
        reg: '',
        moreOfferType: '0',
        sdate: GetDateStr($scope.queryDate),
        edate: GetDateStr(1),
        type: '1',
        pictype: ""
    };//, pageNumber:1
    $scope.condition.adtype = adtype && adtype !== "0" ? adtype : "";
    //常用地区
    $scope.mainGeos = app.locale.MAINGEOS;

    //获取用户
    restAPI.statistics.get({
        ID: 'getUsers'
    }, function (data) {
        $scope.users = data.data;
        if (angular.isUndefined(pubid) || pubid === null) {
            $scope.condition.pubid = $scope.users[0].pubid;
            app.store("statisticPubid", $scope.users[0].pubid);
        } else {
            $scope.condition.pubid = pubid;
        }

        //region 获取地区
        restAPI.sys.get({
            ID: 'listGeo'
        }, function (data) {
            $scope.regions = data.data;
        });
    });

    $scope.showImg = function (res) {
        $scope.myImg = res;
    };

    //监控时间
    $scope.$watch("queryDate", function (newVal, oldVal) {
        if (newVal === oldVal) {
            return;
        }
        $scope.condition.sdate = GetDateStr(newVal);
        if (newVal === "1" || newVal === "0" || newVal === "2") {
            //代表实时,按小时区分
            $scope.condition.type = "1";
            $scope.condition.edate = GetDateStr(newVal);
        } else if (newVal === "-1") {//本月(从这个月开始算到昨天)
            //按天区分
            $scope.condition.type = "0";
            $scope.condition.sdate = GetDateStr(newVal);
            $scope.condition.edate = GetDateStr(1);
        } else if (newVal === "-2") {//上月
            //按天区分
            $scope.condition.type = "0";
            var dd = new Date();
            var month = dd.getMonth();//上月
            dd.setMonth(month);
            dd.setDate(0);
            var monthNum = dd.getDate();
            $scope.condition.sdate = dd.getFullYear() + "-" + month + "-01";
            $scope.condition.edate = dd.getFullYear() + "-" + month + "-" + monthNum;
        } else {
            $scope.condition.edate = GetDateStr(1);
        }
    });

    //监控用户变化,获取对应的被推广的应用
    $scope.$watch("condition.pubid", function (newVal, oldVal) {
        if (newVal === oldVal) {
            return;
        }
        restAPI.statistics.get({
            ID: "getUserPopularizedApp",
            OP: app.store('platform'),
            pubid: $scope.condition.pubid
        }, function (data) {
            app.store("statisticPubid", $scope.condition.pubid);
            $scope.apps = data.data;
        });
    });

    $scope.hostAppConversionList = [];
    $scope.host_pagination = {};
    //分页初始化对象
    $scope.pagination = {};
    //列表排序初始化
    /*$scope.col = 'click_num';//默认按click_num列排序
     $scope.desc = 1;//默认排序条件升序*/
    $scope.picStatisticsData = [];

    //监控条件变化
    $scope.$watch("condition", function (newVal, oldVal) {
        if (newVal === oldVal) {
            return;
        }

        if (adtype !== "pic") {
            restAPI.statistics.save({
                ID: 'getDataByCondition',
                OP: app.store("platform")
            }, $scope.condition, function (data) {
                // $scope.conversionList = [];
                // $scope.apptotal = null;
                if (data.data) {
                    highchartsOptions.xAxis.categories = data.data.categories;
                    highchartsOptions.series = data.data.appDateList;
                    // if(data.data.appConversionList) {
                    //     $scope.conversionList = data.data.appConversionList;
                    //     $scope.apptotal = data.data.apptotal;
                    // }
                    Highcharts.chart('chartContainer', highchartsOptions);
                }
            });

            restAPI.statistics.save({
                ID: 'getHostData',
                OP: app.store("platform")
            }, $scope.condition, function (data) {
                $scope.conversionList = [];
                $scope.hostAppConversionList = [];
                $scope.host_pagination = {};
                $scope.apptotal = null;
                if (data.data) {
                    // highchartsOptions.xAxis.categories = data.data.categories;
                    // highchartsOptions.series = data.data.appDateList;
                    if (data.data.appConversionList) {
                        $scope.hostAppConversionList = data.data.appConversionList;
                        $scope.apptotal = data.data.apptotal;

                        $scope.conversionList = $scope.hostAppConversionList.slice(0, 20);
                        $scope.host_pagination.pageSize = 20;
                        $scope.host_pagination.totalRow = $scope.hostAppConversionList.length;
                        $scope.host_pagination.pageNumber = 1;
                    }
                    // Highcharts.chart('chartContainer', highchartsOptions);
                }

            });
        } else {
            restAPI.statistics.save({
                ID: 'getPicClickData',
                OP: app.store("platform")
            }, $scope.condition, function (data) {
                if (data.data) {
                    $scope.picStatisticsData = data.data.piclist;
                    $scope.pagination.pageSize = 20;
                    $scope.pagination.totalRow = data.data.totalRow;
                    $scope.pagination.pageNumber = 1;
                } else {
                    $scope.picStatisticsData = [];
                    $scope.pagination = {};
                    $scope.pagination.totalRow = 0;
                }
            });
        }
    }, true);
    //分页
    $scope.$on('genPagination', function (event, p) {
        if (event.stopPropagation)
            event.stopPropagation();
        if (adtype !== "pic") {
            if ($scope.hostAppConversionList !== null) {
                $scope.conversionList = $scope.hostAppConversionList.slice(20 * (p - 1), 20 * p);
                $scope.host_pagination.pageSize = 20;
                $scope.host_pagination.totalRow = $scope.hostAppConversionList.length;
                $scope.host_pagination.pageNumber = p;
            }
        } else {
            var condition = angular.copy($scope.condition);
            condition.pageNumber = p;
            restAPI.statistics.save({
                ID: 'getPicClickData',
                OP: app.store("platform")
            }, condition, function (data) {
                if (data.data) {
                    $scope.picStatisticsData = data.data.piclist;
                    $scope.pagination.pageSize = 20;
                    $scope.pagination.totalRow = data.data.totalRow;
                    $scope.pagination.pageNumber = p;
                } else {
                    $scope.picStatisticsData = [];
                    $scope.pagination = {};
                }
            });
        }
    });
    //宿主应用推广导出
    $scope.exportToExcel = function (tableId) { // ex: '#my-table'
        if (adtype !== "pic") {
            // sheet name
            var promoteApp = $("#app-select2").find("option:selected").text();
            if ($scope.condition.pname === "") {
                promoteApp = "All App";
            }
            $scope.exportHref = Excel.tableToExcel(tableId, promoteApp);
            $timeout(function () {
                location.href = $scope.exportHref;
            }, 100); // trigger download
        }
    }
}]).controller('sadminNewTagCtrl', ['app', '$scope', function (app, $scope) {
    if (!app.rootScope.global.isLogin) {
        app.$state.go('login');
        return;
    }

    //检测是否为超管
    if (app.store("user").pub_level === "1") {
        app.rootScope.goBack();
        return;
    }

    var restAPI = app.restAPI;
    var tagid;
    var cla;
    $scope.newTag = {};
    $scope.condition = {};

    //获取所有标签
    restAPI.sadmin.get({
        ID: "getTags",
        OP: app.store("platform")
    }, function (data) {
        $scope.datas = data.data;
    });

    //打开新增标签model
    $scope.showAddTagModel = function () {
        $scope.newTag.name = "";
        $scope.newTag.classification = "";
        $scope.isAddNewTag = true;
    };

    //发布标签库
    $scope.publishTag = function () {
        restAPI.sys.get({
            ID: "publishTag"
        }, function (data) {
            if (data.data === null) {
                app.toast.info("发布完成!");
            }
        });
    };

    //打开更新标签model
    $scope.showUpdateTagModel = function (classification, name, id) {
        $scope.newTag.name = name;
        $scope.newTag.classification = classification;
        tagid = id;
        $scope.isAddNewTag = false;
    };

    //打开更新标签model
    $scope.showAddTagModel1 = function (classification) {
        $scope.newTag.name = "";
        $scope.newTag.classification = classification;
    };

    //打开更新标签分类model
    $scope.showClassificationModel = function (classification) {
        $scope.newTag.name = "";
        $scope.newTag.classification = classification;
        cla = classification;
    };

    //新增标签
    $scope.setNewTag = function () {

        if ($scope.newTag.name === "") {
            app.toast.info("标签名不能为空!");
            return;
        }

        //添加平台
        $scope.newTag.platform = app.store("platform");
        restAPI.sadmin.save({
            ID: "setTag"
        }, $scope.newTag, function () {
            restAPI.sadmin.get({
                ID: "getTags",
                OP: app.store("platform")
            }, function (data) {
                $scope.datas = data.data;
            });
            $("#tagModal").modal('hide');
            $("#tagModal1").modal('hide');
            app.toast.info("新增标签成功!");
        }, function () {

        });
    };

    //修改标签的分类
    $scope.setNewClassification = function () {

        if ($scope.newTag.classification === cla) {
            return;
        }
        if ($scope.newTag.classification === null || $scope.newTag.classification === undefined || $scope.newTag.classification === "") {
            app.toast.info("分类名不能为空！");
            return;
        }

        restAPI.sadmin.save({
            ID: "setNewClassification"
        }, {
            newClassification: $scope.newTag.classification,
            oldClassification: cla,
            platform: app.store("platform")
        }, function () {
            restAPI.sadmin.get({
                ID: "getTags",
                OP: app.store("platform")
            }, function (data) {
                $scope.datas = data.data;
            });
            $("#classificationModel").modal('hide');
            app.toast.info("新增标签成功!");
        }, function () {

        });
    };

    //更新标签
    $scope.updateTag = function () {
        if ($scope.newTag.name === "") {
            app.toast.info("标签名不能为空!");
            return;
        }

        restAPI.sadmin.save({
            ID: "updateTag"
        }, {
            tagId: tagid,
            name: $scope.newTag.name,
            platform: app.store("platform")
        }, function () {
            restAPI.sadmin.get({
                ID: "getTags",
                OP: app.store("platform")
            }, function (data) {
                $scope.datas = data.data;
            });
            app.toast.info("更新成功!");
            $("#tagModal").modal('hide');
        }, function () {

        });
    };

    //删除标签
    $scope.delTag = function (id, name) {
        app.confirmDialog({
            message: "确定删除标签" + name + "?"
        }, function () {
            restAPI.sadmin.save({
                ID: "delTag"
            }, id, function () {
                restAPI.sadmin.get({
                    ID: "getTags",
                    OP: app.store("platform")
                }, function (data) {
                    $scope.datas = data.data;
                });
                app.toast.info("删除成功!");
            });
        }, function () {

        });

    };
}]);
'use strict';
/*global angular, $, adBoost*/

adBoost
    .directive('genTabClick', function () {
        return {
            link: function (scope, element, attr) {
                var className = attr.genTabClick;
                element.bind('click', function () {
                    element.parent().children().removeClass(className);
                    element.addClass(className);
                });
            }
        };
    })
    .directive('changeStyle', function () {
        return {
            scope: '=',
            link: function (scope, element) {
                element.bind('click', function () {
                    element.addClass("border_b");
                    element.siblings().removeClass('border_b');
                });
            }
        };
    })
    .directive('genIconCheckbox', function (app) {
        return {
            scope: '=',
            link: function (scope, element, attr) {
                var type = attr.genIconCheckbox;
                element.bind('click', function () {
                    var imgSrc = element.attr('src');
                    var pattern = new RegExp('_checked', 'g');
                    if (!pattern.test(imgSrc)) {
                        element.attr('src', imgSrc.replace(type + '.png', type + '_checked.png'));
                        element.parent().addClass('bg_checked');
                        element.parent().siblings().removeClass('bg_checked');
                        var otherImgs = element.parent().siblings().children('img');

                        angular.forEach(otherImgs, function (o) {
                            $(o).attr('src', $(o).attr('src').replace(/\/(\w+)_checked/, '\/$1'));
                        });
                        element.next('input').attr('checked', 'true');
                        scope.$apply(function () {
                            if (scope.newApp) {
                                scope.newApp.platform = type === 'android' ? 1 : (type === 'ios' ? 2 : (type === 'windows' ? 3 : (type === 'h5' ? 5 : 1)));
                            } else if (scope.group) {
                                scope.group.platform = type === 'android' ? 1 : (type === 'ios' ? 2 : (type === 'windows' ? 3 : (type === 'h5' ? 5 : 1)));
                            } else if (scope.syn) {
                                scope.syn.platform = type === 'android' ? 1 : (type === 'ios' ? 2 : (type === 'windows' ? 3 : (type === 'h5' ? 5 : 1)));
                            }
                        });
                    }
                });
            }
        };
    })
    .directive('genIconLayout', function () {
        return {
            scope: '=',
            link: function (scope, element, attr) {
                var type = attr.genIconLayout;

                element.bind('click', function () {
                    var imgSrc = element.attr('src');
                    var pattern = new RegExp('_checked', 'g');
                    if (!pattern.test(imgSrc)) {
                        element.attr('src', imgSrc.replace(type + '.png', type + '_checked.png'));
                        element.parent().addClass('bg_checked');
                        element.parent().siblings().removeClass('bg_checked');
                        var otherImgs = element.parent().siblings().children('img');
                        angular.forEach(otherImgs, function (o) {
                            $(o).attr('src', $(o).attr('src').replace(/\/(\w+)_checked/, '\/$1'));
                        });
                        element.next('input').attr('checked', 'true');
                        scope.newApp.layout = type === 'pic_vartical' ? 1 : 2;
                    }
                });
            }
        };
    })
    .directive('genPagination', function () {
        // <div gen-pagination="options"></div>
        // HTML/CSS修改于Bootstrap框架
        // options = {
        //     path: 'pathUrl',
        //     sizePerPage: [25, 50, 100],
        //     pageSize: 25,
        //     pageIndex: 1,
        //     total: 10
        // };
        return {
            scope: true,
            templateUrl: 'gen-pagination.html',
            link: function (scope, element, attr) {
                scope.$watchCollection(attr.genPagination, function (value) {
                    if (!angular.isObject(value)) {
                        return;
                    }
                    var pageNumber = 1,
                        showPages = [],
                        lastPage = Math.ceil(value.totalRow / value.pageSize) || 1;

                    pageNumber = value.pageNumber >= 1 ? value.pageNumber : 1;
                    pageNumber = pageNumber <= lastPage ? pageNumber : lastPage;

                    //从pageNumber开始往前排,直到1
                    showPages[0] = pageNumber;
                    if (pageNumber <= 6) {
                        while (showPages[0] > 1) {
                            showPages.unshift(showPages[0] - 1);
                        }
                    } else {
                        showPages.unshift(showPages[0] - 1);//unshift向数组开头添加一个元素,并返回新的数组长度
                        showPages.unshift(showPages[0] - 1);
                        showPages.unshift('…');
                        showPages.unshift(2);
                        showPages.unshift(1);
                    }

                    if (lastPage - pageNumber <= 5) {
                        while (showPages[showPages.length - 1] < lastPage) {
                            showPages.push(showPages[showPages.length - 1] + 1);
                        }
                    } else {
                        showPages.push(showPages[showPages.length - 1] + 1);
                        showPages.push(showPages[showPages.length - 1] + 1);
                        showPages.push('...');
                        showPages.push(lastPage - 1);
                        showPages.push(lastPage);
                    }

                    scope.prev = pageNumber > 1 ? pageNumber - 1 : 0;
                    scope.next = pageNumber < lastPage ? pageNumber + 1 : 0;
                    scope.total = value.totalRow;
                    scope.pageNumber = pageNumber;
                    scope.showPages = showPages;
                    scope.pageSize = value.pageSize;
                    scope.perPages = value.sizePerPage || [15, 30, 50];
                    scope.path = value.path && value.path + '?p=';
                });
                scope.paginationTo = function (p, s) {
                    if (!scope.path && p > 0) {
                        s = s || scope.pageSize;
                        scope.$emit('genPagination', p, s);
                    }
                };
            }
        };
    })
    .directive('genModal', ['$timeout',
        function ($timeout) {
            //<div gen-modal="msgModal">[body]</div>
            // scope.msgModal = {
            //     id: 'msg-modal',    [option]
            //     title: 'message title',    [option]
            //     width: 640,    [option]
            //     confirmBtn: 'confirm button name',    [option]
            //     confirmFn: function () {},    [option]
            //     cancelBtn: 'cancel button name',    [option]
            //     cancelFn: function () {}    [option]
            //     nextBtn: 'next button name',    [option]
            //     nextFn: function () {}    [option]
            // };
            var uniqueModalId = 0;
            return {
                scope: true,
                transclude: true,
                templateUrl: 'gen-modal.html',
                link: function (scope, element, attr) {
                    var modalStatus,
                        modalElement = element.children(),
                        list = ['Next', 'Confirm', 'Cancel'],
                        options = scope.$eval(attr.genModal),
                        isFunction = angular.isFunction;

                    function wrap(fn) {
                        return function () {
                            var value = isFunction(fn) ? fn() : true;
                            showModal(!value);
                        };
                    }

                    function resize() {
                        var jqWin = $(window),
                            element = modalElement.children(),
                            top = (jqWin.height() - element.outerHeight()) * 0.182,
                            css = {};

                        css.marginTop = top > 0 ? top : 0;
                        element.css(css);
                    }

                    function showModal(value) {
                        modalElement.modal(value ? 'show' : 'hide');
                        if (value) {
                            $timeout(resize);
                        }
                    }

                    options.cancelFn = options.cancelFn || true;
                    options.backdrop = options.backdrop || true;
                    options.show = options.show || false;
                    options.modal = showModal;

                    scope.$watch(function () {
                        return options;
                    }, function (value) {
                        angular.extend(scope, value);
                    }, true);

                    scope.id = scope.id || attr.genModal + '-' + (uniqueModalId++);
                    angular.forEach(list, function (name) {
                        var x = name.toLowerCase(),
                            cb = x + 'Cb',
                            fn = x + 'Fn',
                            btn = x + 'Btn';
                        scope[cb] = options[fn] && wrap(options[fn]);
                        scope[btn] = options[btn] || (options[fn] && name);
                    });

                    modalElement.on('shown.bs.modal', function (event) {
                        modalStatus = true;
                    });
                    modalElement.on('hidden.bs.modal', function (event) {
                        options.cancelFn();
                        modalStatus = false;
                    });
                    modalElement.modal(options);
                }
            };
        }
    ])
    .directive('genTooltip', ['$timeout', 'isVisible',
        function ($timeout, isVisible) {
            return {
                require: '?ngModel',
                link: function (scope, element, attr, ctrl) {
                    var enable = false,
                        option = scope.$eval(attr.genTooltip) || {};

                    function invalidMsg(invalid) {
                        ctrl.validate = enable && option.validate && isVisible(element);
                        if (ctrl.validate) {
                            var title = (attr.validName && attr.validName + ' ') || '';
                            if (invalid && option.validateMsg) {
                                angular.forEach(ctrl.$error, function (value, key) {
                                    title += (value && option.validateMsg[key] && option.validateMsg[key] + ', ') || '';
                                });
                            }
                            title = title.slice(0, -2) || attr.originalTitle || attr.title;
                            attr.$set('dataOriginalTitle', title ? title : '');
                            showTooltip(!!invalid);
                        } else {
                            showTooltip(false);
                        }
                    }

                    function validateFn(value) {
                        $timeout(function () {
                            invalidMsg(ctrl.$invalid);
                        });
                        return value;
                    }

                    function initTooltip() {
                        element.off('.tooltip').removeData('bs.tooltip');
                        // element.tooltip(option);
                    }

                    function showTooltip(show) {
                        if (element.hasClass('invalid-error') !== show) {
                            element[show ? 'addClass' : 'removeClass']('invalid-error');
                            // element.tooltip(show ? 'show' : 'hide');
                        }
                    }

                    if (option.container === 'inner') {
                        option.container = element;
                    } else if (option.container === 'ngView') {
                        option.container = element.parents('.ng-view')[0] || element.parents('[ng-view]')[0];
                    }
                    // use for AngularJS validation
                    if (option.validate) {
                        option.template = '<div class="tooltip validate-tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>';
                        option.trigger = 'manual';
                        option.placement = option.placement || 'bottom';
                        if (ctrl) {
                            ctrl.$formatters.push(validateFn);
                            ctrl.$parsers.push(validateFn);
                            ctrl.singleValidate = function () {
                                enable = true;
                                if (this) {
                                    invalidMsg(this.$invalid);
                                }
                                //enable = !enable;
                            };
                        } else {
                            scope.$watch(function () {
                                return attr.originalTitle || attr.dataOriginalTitle;
                            }, showTooltip);
                        }
                        element.bind('focus', function () {
                            element.trigger('input');
                            element.trigger('change');
                        });
                        scope.$on('genTooltipValidate', function (event, collect, turnoff) {
                            enable = !turnoff;
                            if (ctrl) {
                                if (angular.isArray(collect)) {
                                    collect.push(ctrl);
                                }
                                invalidMsg(ctrl.$invalid);
                            }
                        });
                    } else if (option.click) {
                        // option.click will be 'show','hide','toggle', or 'destroy'
                        element.bind('click', function () {
                            // element.tooltip(option.click);
                        });
                    }
                    element.bind('hidden.bs.tooltip', initTooltip);
                    initTooltip();
                }
            };
        }
    ])
    .directive('genMoving', ['anchorScroll',
        function (anchorScroll) {
            return {
                link: function (scope, element, attr) {
                    var option = scope.$eval(attr.genMoving);

                    function resetTextarea() {
                        var textarea = element.find('textarea');
                        if (textarea.is(textarea)) {
                            textarea.css({
                                height: 'auto',
                                width: '100%'
                            });
                        }
                    }

                    option.appendTo = function (selector) {
                        element.appendTo($(selector));
                        resetTextarea();
                    };
                    option.prependTo = function (selector) {
                        element.prependTo($(selector));
                        resetTextarea();
                    };
                    option.childrenOf = function (selector) {
                        return $(selector).find(element).is(element);
                    };
                    option.scrollIntoView = function (top, height) {
                        anchorScroll.toView(element, top, height);
                    };
                    option.inView = function () {
                        return anchorScroll.inView(element);
                    };
                }
            };
        }
    ])
    .directive('genSrc', ['isVisible',
        function (isVisible) {
            return {
                priority: 99,
                link: function (scope, element, attr) {
                    attr.$observe('genSrc', function (value) {
                        if (value && isVisible(element)) {
                            var img = new Image();
                            img.onload = function () {
                                attr.$set('src', value);
                            };
                            img.src = value;
                        }
                    });
                }
            };
        }
    ])
    .directive('genUploader', ['$fileUploader', 'app',
        function ($fileUploader, app) {
            // <div gen-pagination="options"></div>
            // HTML/CSS修改于Bootstrap框架
            // options = {
            //     path: 'pathUrl',
            //     sizePerPage: [25, 50, 100],
            //     pageSize: 25,
            //     pageIndex: 1,
            //     total: 10
            // };
            return {
                scope: true,
                templateUrl: 'gen-uploader.html',
                link: function (scope, element, attr) {
                    var options = scope.$eval(attr.genUploader);
                    var fileType = options.fileType;
                    scope.triggerUpload = function () {
                        setTimeout(function () {
                            element.find('.upload-input').click();
                        });
                    };
                    scope.clickImage = options.clickImage || angular.noop;
                    var uploaded = scope.uploaded = [];

                    // create a uploader with options
                    var uploader = scope.uploader = $fileUploader.create({
                        scope: options.scope || scope,
                        url: options.url,
                        formData: [{
                            policy: options.policy,
                            signature: options.signature
                        }],
                        filters: [
                            function (file) {
                                var judge = true,
                                    parts = file.name.split('.');
                                parts = parts.length > 1 ? parts.slice(-1)[0] : '';
                                if (!parts || options.allowFileType.indexOf(parts.toLowerCase()) < 0) {
                                    judge = false;
                                    app.toast.warning(app.locale.UPLOAD.fileType);
                                }
                                return judge;
                            }
                        ]
                    });

                    uploader.bind('complete', function (event, xhr, item) {
                        var response = app.parseJSON(xhr.response) || {};
                        if (~[200, 201].indexOf(xhr.status)) {
                            var file = app.union(item.file, response);
                            file.url = options.baseUrl + file.url;
                            uploaded.push(file);
                            item.remove();
                        } else {
                            item.progress = 0;
                            app.toast.warning(response.message, response.code);
                        }
                    });
                }
            };
        }
    ]).directive('bsSwitch', function ($parse, $timeout) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function link(scope, element, attrs, controller) {
            var isInit = false;

            /**
             * Return the true value for this specific checkbox.
             * @returns {Object} representing the true view value; if undefined, returns true.
             */
            var getTrueValue = function () {
                if (attrs.type === 'radio') {
                    return attrs.value || $parse(attrs.ngValue)(scope) || true;
                }
                var trueValue = ($parse(attrs.ngTrueValue)(scope));
                if (angular.isUndefined(trueValue)) {
                    trueValue = true;
                }
                return trueValue;
            };

            /**
             * Get a boolean value from a boolean-like string, evaluating it on the current scope.
             * @param value The input object
             * @returns {boolean} A boolean value
             */
            var getBooleanFromString = function (value) {
                return scope.$eval(value) === true;
            };

            /**
             * Get a boolean value from a boolean-like string, defaulting to true if undefined.
             * @param value The input object
             * @returns {boolean} A boolean value
             */
            var getBooleanFromStringDefTrue = function (value) {
                return (value === true || value === 'true' || !value);
            };

            /**
             * Returns the value if it is truthy, or undefined.
             *
             * @param value The value to check.
             * @returns the original value if it is truthy, {@link undefined} otherwise.
             */
            var getValueOrUndefined = function (value) {
                return (value ? value : undefined);
            };

            /**
             * Get the value of the angular-bound attribute, given its name.
             * The returned value may or may not equal the attribute value, as it may be transformed by a function.
             *
             * @param attrName  The angular-bound attribute name to get the value for
             * @returns {*}     The attribute value
             */
            var getSwitchAttrValue = function (attrName) {
                var map = {
                    'switchRadioOff': getBooleanFromStringDefTrue,
                    'switchActive': function (value) {
                        return !getBooleanFromStringDefTrue(value);
                    },
                    'switchAnimate': getBooleanFromStringDefTrue,
                    'switchLabel': function (value) {
                        return value ? value : '&nbsp;';
                    },
                    'switchIcon': function (value) {
                        if (value) {
                            return '<span class=\'' + value + '\'></span>';
                        }
                    },
                    'switchWrapper': function (value) {
                        return value || 'wrapper';
                    },
                    'switchInverse': getBooleanFromString,
                    'switchReadonly': getBooleanFromString
                };
                var transFn = map[attrName] || getValueOrUndefined;
                return transFn(attrs[attrName]);
            };

            /**
             * Set a bootstrapSwitch parameter according to the angular-bound attribute.
             * The parameter will be changed only if the switch has already been initialized
             * (to avoid creating it before the model is ready).
             *
             * @param element   The switch to apply the parameter modification to
             * @param attr      The name of the switch parameter
             * @param modelAttr The name of the angular-bound parameter
             */
            var setSwitchParamMaybe = function (element, attr, modelAttr) {
                if (!isInit) {
                    return;
                }
                var newValue = getSwitchAttrValue(modelAttr);
                element.bootstrapSwitch(attr, newValue);
            };

            var setActive = function () {
                setSwitchParamMaybe(element, 'disabled', 'switchActive');
            };

            /**
             * If the directive has not been initialized yet, do so.
             */
            var initMaybe = function () {
                // if it's the first initialization
                if (!isInit) {
                    var viewValue = (controller.$modelValue === getTrueValue());
                    isInit = !isInit;
                    // Bootstrap the switch plugin
                    element.bootstrapSwitch({
                        radioAllOff: getSwitchAttrValue('switchRadioOff'),
                        disabled: getSwitchAttrValue('switchActive'),
                        state: viewValue,
                        onText: getSwitchAttrValue('switchOnText'),
                        offText: getSwitchAttrValue('switchOffText'),
                        onColor: getSwitchAttrValue('switchOnColor'),
                        offColor: getSwitchAttrValue('switchOffColor'),
                        animate: getSwitchAttrValue('switchAnimate'),
                        size: getSwitchAttrValue('switchSize'),
                        labelText: attrs.switchLabel ? getSwitchAttrValue('switchLabel') : getSwitchAttrValue('switchIcon'),
                        wrapperClass: getSwitchAttrValue('switchWrapper'),
                        handleWidth: getSwitchAttrValue('switchHandleWidth'),
                        labelWidth: getSwitchAttrValue('switchLabelWidth'),
                        inverse: getSwitchAttrValue('switchInverse'),
                        readonly: getSwitchAttrValue('switchReadonly')
                    });
                    if (attrs.type === 'radio') {
                        controller.$setViewValue(controller.$modelValue);
                    } else {
                        controller.$setViewValue(viewValue);
                    }
                }
            };

            /**
             * Listen to model changes.
             */
            var listenToModel = function () {

                attrs.$observe('switchActive', function (newValue) {
                    var active = getBooleanFromStringDefTrue(newValue);
                    // if we are disabling the switch, delay the deactivation so that the toggle can be switched
                    if (!active) {
                        $timeout(function () {
                            setActive(active);
                        });
                    } else {
                        // if we are enabling the switch, set active right away
                        setActive(active);
                    }
                });

                function modelValue() {
                    return controller.$modelValue;
                }

                // When the model changes
                scope.$watch(modelValue, function (newValue) {
                    initMaybe();
                    if (newValue !== undefined) {
                        element.bootstrapSwitch('state', newValue === getTrueValue(), false);
                    } else {
                        element.bootstrapSwitch('toggleIndeterminate', true, false);
                    }
                }, true);

                // angular attribute to switch property bindings
                var bindings = {
                    'switchRadioOff': 'radioAllOff',
                    'switchOnText': 'onText',
                    'switchOffText': 'offText',
                    'switchOnColor': 'onColor',
                    'switchOffColor': 'offColor',
                    'switchAnimate': 'animate',
                    'switchSize': 'size',
                    'switchLabel': 'labelText',
                    'switchIcon': 'labelText',
                    'switchWrapper': 'wrapperClass',
                    'switchHandleWidth': 'handleWidth',
                    'switchLabelWidth': 'labelWidth',
                    'switchInverse': 'inverse',
                    'switchReadonly': 'readonly'
                };

                var observeProp = function (prop, bindings) {
                    return function () {
                        attrs.$observe(prop, function () {
                            setSwitchParamMaybe(element, bindings[prop], prop);
                        });
                    };
                };

                // for every angular-bound attribute, observe it and trigger the appropriate switch function
                for (var prop in bindings) {
                    attrs.$observe(prop, observeProp(prop, bindings));
                }
            };

            /**
             * Listen to view changes.
             */
            var listenToView = function () {
                if (attrs.type === 'radio') {
                    // when the switch is clicked
                    element.on('change.bootstrapSwitch', function (e) {
                        // discard not real change events
                        if ((controller.$modelValue === controller.$viewValue) && (e.target.checked !== $(e.target).bootstrapSwitch('state'))) {
                            // $setViewValue --> $viewValue --> $parsers --> $modelValue
                            // if the switch is indeed selected
                            if (e.target.checked) {
                                // set its value into the view
                                controller.$setViewValue(getTrueValue());
                            } else if (getTrueValue() === controller.$viewValue) {
                                // otherwise if it's been deselected, delete the view value
                                controller.$setViewValue(undefined);
                            }
                        }
                    });
                } else {
                    // When the checkbox switch is clicked, set its value into the ngModel
                    element.on('switchChange.bootstrapSwitch', function (e) {
                        // $setViewValue --> $viewValue --> $parsers --> $modelValue
                        controller.$setViewValue(e.target.checked);
                    });
                }
            };

            // Listen and respond to view changes
            listenToView();

            // Listen and respond to model changes
            listenToModel();

            // On destroy, collect ya garbage
            scope.$on('$destroy', function () {
                element.bootstrapSwitch('destroy');
            });
        }
    };
})
    .directive('bsSwitch', function () {
        return {
            restrict: 'E',
            require: 'ngModel',
            template: '<input bs-switch>',
            replace: true
        };
    })
    .directive('genMouseenter', function (app) {
        return {
            scope: "=",
            link: function (scope, element, attr) {
                var type = attr.genMouseenter;
                element.bind('mouseover', function () {
                    element.addClass('bg_checked');
                    var currentImg = element.children('img').attr('src');
                    var pattern = new RegExp('_checked', 'g');
                    if (!pattern.test(currentImg)) {
                        element.children('img').attr('src', currentImg.replace(type + '.png', type + '_checked.png'));
                    }
                });
                element.bind('click', function () {
                    app.rootScope.platform = type === 'android' ? 1 : (type === 'ios' ? 2 : (type === 'windows' ? 3 : (type === 'h5' ? 5 : 1)));
                    app.$state.go('entrance.batch.g', {entId: 1});
                });
                element.bind('mouseout', function () {
                    element.removeClass('bg_checked');
                    var currentImg = element.children('img').attr('src');
                    var pattern = new RegExp('_checked', 'g');
                    if (pattern.test(currentImg)) {
                        element.children('img').attr('src', currentImg.replace(type + '_checked.png', type + '.png'));
                    }
                });
            }
        };
    })
    .directive("ngFocus", [function () {
        var FOCUS_CLASS = "ng-focused";
        return {
            restrict: "A",
            require: "ngModel",
            link: function (scope, element, attr, ctrl) {
                ctrl.$isFocused = false;
                element.bind("focus", function () {
                    element.addClass(FOCUS_CLASS);
                    ctrl.$isFocused = true;
                }).bind("blur", function () {
                    element.removeClass(FOCUS_CLASS);
                    ctrl.$isFocused = false;
                });
            }
        };
    }]);
'use strict';
/*global angular, adBoost*/

adBoost
.filter('placeholder', ['JSONKit',
    function (JSONKit) {
        return function (str) {
            return JSONKit.toStr(str) || '-';
        };
    }
])
.filter('match', ['$locale',
    function ($locale) {
        return function (value, type) {
            return $locale.FILTER[type] && $locale.FILTER[type][value] || '';
        };
    }
])
.filter('switch', ['$locale',
    function ($locale) {
        return function (value, type) {
            return $locale.FILTER[type] && $locale.FILTER[type][+ !! value] || '';
        };
    }
])
.filter('checkName', ['JSONKit',
    function (JSONKit) {
        return function (text) {
            var reg = /^[\u4e00-\u9fa5]{1,12}$/;
            text = JSONKit.toStr(text);
            return reg.test(text);
        };
    }
])
.filter('checkEmail', ['JSONKit',
    function (JSONKit) {
        return function (text) {
            var reg = /^(\w)+(\.\w+)*@(\w)+((\.\w+)+)$/;
            text = JSONKit.toStr(text);
            return reg.test(text);
        };
    }
])
.filter('checkTel', ['JSONKit',
    function (JSONKit) {
        return function (text) {
            var reg = /^((1[34578]\d{9})|(0[0-9]{2,3}\-)?([2-9][0-9]{6,7})+(\-[0-9]{1,4})?)$/;
            text = JSONKit.toStr(text);
            return reg.test(text);
        };
    }
])
.filter('checkWeight', ['JSONKit',
    function (JSONKit) {
        return function (text) {
            var reg = /^[0-9]\d*$/;
            text = JSONKit.toStr(text);
            return reg.test(text);
        };
    }
])
.filter('checkInt', ['JSONKit',
    function (JSONKit) {
        return function (text) {
            var reg = /^-?\d*$/;
            text = JSONKit.toStr(text);
            return reg.test(text);
        };
    }
])
.filter('checkDigitalFormat', ['JSONKit',
        function(JSONKit){
            return function(text){
                var reg = /^[1-9][0-9]*$/;
                text = JSONKit.toStr(text);
                return reg.test(text);
            };
        }
])
.filter('length', ['utf8', 'JSONKit',
    function (utf8, JSONKit) {
        return function (text) {
            text = JSONKit.toStr(text);
            return utf8.stringToBytes(text).length;
        };
    }
])
.filter('cutText', ['utf8', 'JSONKit',
    function (utf8, JSONKit) {
        return function (text, len) {
            text = JSONKit.toStr(text).trim();
            var bytes = utf8.stringToBytes(text);
            len = len > 0 ? len : 0;
            if (bytes.length > len) {
                bytes.length = len;
                text = utf8.bytesToString(bytes);
                text = text.slice(0, -2) + '…';
            }
            return text;
        };
    }
])
.filter('formatDate', ['$filter', '$locale',
    function ($filter, $locale) {
        return function (date, full) {
            var o = Date.now() - date,
                dateFilter = $filter('date');
            if (full) {
                return dateFilter(date, $locale.DATETIME.fullD);
            } else if (o > 259200000) {
                return dateFilter(date, $locale.DATETIME.shortD);
            } else if (o > 86400000) {
                return Math.floor(o / 86400000) + $locale.DATETIME.dayAgo;
            } else if (o > 3600000) {
                return Math.floor(o / 3600000) + $locale.DATETIME.hourAgo;
            } else if (o > 60000) {
                return Math.floor(o / 60000) + $locale.DATETIME.minuteAgo;
            } else {
                return $locale.DATETIME.secondAgo;
            }
        };
    }
])
.filter('formatTime', ['$locale',
    function ($locale) {
        return function (seconds) {
            var re = '',
                q = 0,
                o = seconds > 0 ? Math.round(+seconds) : Math.floor(Date.now() / 1000),
                TIME = $locale.DATETIME;

            function calculate(base) {
                q = o % base;
                o = (o - q) / base;
                return o;
            }
            calculate(60);
            re = q + TIME.second;
            calculate(60);
            re = (q > 0 ? (q + TIME.minute) : '') + re;
            calculate(24);
            re = (q > 0 ? (q + TIME.hour) : '') + re;
            return o > 0 ? (o + TIME.day + re) : re;
        };
    }
])
.filter('formatBytes', ['$locale',
    function ($locale) {
        return function (bytes) {
            bytes = bytes > 0 ? bytes : 0;
            if (!bytes) {
                return '-';
            } else if (bytes < 1024) {
                return bytes + 'B';
            } else if (bytes < 1048576) {
                return (bytes / 1024).toFixed(3) + ' KiB';
            } else if (bytes < 1073741824) {
                return (bytes / 1048576).toFixed(3) + ' MiB';
            } else {
                return (bytes / 1073741824).toFixed(3) + ' GiB';
            }
        };
    }
]);
'use strict';
/*global angular, adBoost*/

adBoost
.factory('i18n-zh', ['$locale',
    function ($locale) {
        angular.extend($locale, {
            RESET: {
                locked: '申请解锁',
                passwd: '找回密码',
                email: '请求信息已发送到您的邮箱，请查收。'
            },
            RESPONSE: {
                success: '请求成功',
                error: '请求失败'
            },
            VALIDATE: {
                required: '必填！',
                minlength: '太短！',
                maxlength: '太长！',
                min: '太小！',
                max: '太大！',
                more: '太多！',
                pattern: '格式无效！',
                username: '有效字符为汉字！',
                minname: '长度应大于5字节，一个汉字3字节！',
                maxname: '长度应小于15字节，一个汉字3字节！',
                repasswd: '不一致！',
                repasswd1: '新旧密码不能一样！',
                alreadyExists: '已经存在',
                isNumberType: '请输入数字',
                errorDigitalFormat: '格式不正确（大于零的整数）',
                selfEmail: '不能添加自己账号',
                url: 'URL无效！',
                tag: '标签错误，不能包含“,”、“，”和“、”',
                size: '标签错误'
            },
            BTN_TEXT: {
                next: '下一步',
                confirm: '确定',
                save: '保存',
                cancel: '取消',
                remove: '删除',
                goBack: '返回'
            },
            TIMING: {
                goHome: '秒钟后自动返回主页',
                goLogin: '秒钟后自动返回登录页',
                goGroup: '秒钟后自动返回运营组添加页'
            },
            HOME: {
                title: '我的主页',
                index: ' 更新，阅读时间线：',
                mark: '我的收藏',
                article: '我的文章',
                comment: '我的评论',
                follow: '我的关注',
                fans: '我的粉丝'
            },
            ADMIN: {
                index: '网站信息',
                user: '用户管理',
                tag: '标签管理',
                article: '文章管理',
                comment: '评论管理',
                message: '消息管理',
                global: '网站设置',
                updated: '成功更新 ',
                noUpdate: '设置暂无变更'
            },
            USER: {
                title: '的主页',
                login: '用户登录',
                reset: '用户信息找回',
                register: '用户注册',
                registerOK: '注册成功',
                updatePwdOK : '密码更新成功',
                article: '的文章',
                fans: '的粉丝',
                followed: '已关注 ',
                unfollowed: '已取消关注 ',
                email: '验证邮件已发送到新邮箱，通过验证后才保存修改',
                updated: '用户信息更新成功',
                noUpdate: '用户信息暂无变更',
                noLogin: '您还未登录'
            },
            APPS: {
                title: 'APP管理',
                addButton: '添加APP'
            },
            APP: {
                title: '添加/编辑APP',
                addTitle: '添加APP',
                addDescption: '添加描叙信息',
                addRes: '添加推广图信息',
                removed: '删除成功 ',
                updated: '更新成功 ',
                inserted: '添加成功',
                updatedErr: '更新失败',
                seted: '暂未提供，敬请期待！',
                platformShow: '请选择发布平台！',
                lastSDKV: 3003
            },
            GROUPS: {
                title: '运营组管理',
                addButton: '添加运营组',
                errorNoPutApp: '请添加APP',
                updated: '成功更新 ',
                errorNoGroups: '此app还没添加运营组'
            },
            TAGS: {
                title: '标签管理',
                addButton: '添加标签'
            },
            TAG: {
                title: '热门标签',
                removed: '删除成功 ',
                updated: '更新成功 ',
                noUpdate: '标签暂无变更'
            },
            ADS: {
                manageTitle: '广告管理',
                addButton: '添加广告'
            },
            FILTER: {
                role: ['禁言', '待验证', '会员', '组员', '编辑', '管理员'],
                follow: ['关注', '已关注'],
                favor: ['支持', '已支持'],
                mark: ['收藏', '已收藏'],
                oppose: ['反对', '已反对'],
                highlight: ['置顶', '取消置顶'],
                turn: ['开启', '关闭'],
                edit: ['添加', '编辑'],
                gender: {
                    male: '男',
                    female: '女'
                }
            },
            DATETIME: {
                second: '秒',
                minute: '分',
                hour: '时',
                day: '天',
                month: '月',
                year: '年',
                fullD: 'yyyy年MM月dd日 HH:mm',
                shortD: 'MM-dd HH:mm',
                dayAgo: '天前',
                hourAgo: '小时前',
                minuteAgo: '分钟前',
                secondAgo: '刚刚'
            },
            UPLOAD: {
                fileType: '文件类型无效，仅允许png、gif、jpg文件！',
                requiredImg: '请至少提供一张默认的推广图'
            },
            MAINGEOS: [
                {
                    code: "id",
                    name: "印度尼西亚"
                },{
                    code: "in",
                    name: "印度"
                },{
                    code: "br",
                    name: "巴西"
                },{
                    code: "us",
                    name: "美国"
                },{
                    code: "th",
                    name: "泰国"
                },{
                    code: "eg",
                    name: "埃及"
                },{
                    code: "pk",
                    name: "巴基斯坦"
                },{
                    code: "ru",
                    name: "俄罗斯"
                },{
                    code: "my",
                    name: "马来西亚"
                },{
                    code: "tr",
                    name: "土耳其"
                },{
                    code: "mx",
                    name: "墨西哥"
                },{
                    code: "fr",
                    name: "法国"
                },{
                    code: "es",
                    name: "西班牙"
                },{
                    code: "it",
                    name: "意大利"
                },{
                    code: "ir",
                    name: "伊朗"
                },{
                    code: "bd",
                    name: "孟加拉国"
                },{
                    code: "de",
                    name: "德国"
                },{
                    code: "co",
                    name: "哥伦比亚"
                },{
                    code: "ar",
                    name: "阿根廷"
                },{
                    code: "tw",
                    name: "中国台湾"
                },{
                    code: "sa",
                    name: "沙特阿拉伯"
                },{
                    code: "ph",
                    name: "菲律宾"
                },{
                    code: "vn",
                    name: "越南"
                },{
                    code: "do",
                    name: "多米尼加共和国"
                },{
                    code: "cl",
                    name: "智利"
                },{
                    code: "gb",
                    name: "英国"
                },{
                    code: "ro",
                    name: "罗马尼亚"
                },{
                    code: "ve",
                    name: "委内瑞拉"
                },{
                    code: "hk",
                    name: "中国香港"
                }
            ]
        });
        return $locale;
    }
]);
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

'use strict';
/*global angular, adBoost, Sanitize, toastr, CryptoJS, utf8, store, JSONKit*/

adBoost
.factory('restAPI', ['$resource',
    function ($resource) {
        return {
            heartbeat: $resource('/admin/api/hb/i'),
            user: $resource('/admin/api/user/:ID/:OP'),
            app: $resource('/admin/api/app/:ID/:OP'),
            campaign: $resource('/admin/api/campaign/:ID/:OP'),
            sys: $resource('/admin/api/sys/:ID/:OP'),
            pub: $resource('/admin/api/pub/:ID/:OP'),
            statistics: $resource('/admin/api/statistics/:ID/:OP'),
            sadmin: $resource('/admin/api/sadmin/:ID/:OP'),
            res: $resource('/admin/api/res/:ID/:OP'),
            log: $resource('/admin/api/log/:ID/:OP'),
            notice: $resource('/admin/api/notice/:ID/:OP'),
            task:$resource('/admin/api/task/:ID/:OP'),
            dashboard:$resource('/admin/api/dashboard/:ID/:OP')
        };
    }
])
.factory('cache', ['$cacheFactory', function ($cacheFactory) {
        return {
            region: $cacheFactory('region', {
                capacity: 200
            }),
            language: $cacheFactory('language', {
                capacity: 200
            }),
            paramtmpl: $cacheFactory('paramtmpl', {
                capacity: 200
            })
        };
    }
])
.factory('myConf', ['$cookieStore', 'JSONKit', function ($cookieStore, JSONKit) {
        function checkValue(value, defaultValue) {
            return value == null ? defaultValue : value;
        }

        function myCookies(name, initial) {
            return function (value, pre, defaultValue) {
                pre = JSONKit.toStr(pre) + name;
                defaultValue = checkValue(defaultValue, initial);
                var result = checkValue($cookieStore.get(pre), defaultValue);
                if ((value != null) && result !== checkValue(value, defaultValue)) {
                    $cookieStore.put(pre, value);
                    result = value;
                }
                return result;
            };
        }
        return {
            pageSize: myCookies('PageSize', 10),
            sumModel: myCookies('sumModel', false)
        };
    }
])
.factory('anchorScroll', function () {
    function toView(element, top, height) {
        var winHeight = $(window).height();

        element = $(element);
        height = height > 0 ? height : winHeight / 10;
        $('html, body').animate({
            scrollTop: top ? (element.offset().top - height) : (element.offset().top + element.outerHeight() + height - winHeight)
        }, {
            duration: 200,
            easing: 'linear',
            complete: function () {
                if (!inView(element)) {
                    element[0].scrollIntoView( !! top);
                }
            }
        });
    }

    function inView(element) {
        element = $(element);

        var win = $(window),
            winHeight = win.height(),
            eleTop = element.offset().top,
            eleHeight = element.outerHeight(),
            viewTop = win.scrollTop(),
            viewBottom = viewTop + winHeight;

        function isInView(middle) {
            return middle > viewTop && middle < viewBottom;
        }

        if (isInView(eleTop + (eleHeight > winHeight ? winHeight : eleHeight) / 2)) {
            return true;
        } else if (eleHeight > winHeight) {
            return isInView(eleTop + eleHeight - winHeight / 2);
        } else {
            return false;
        }
    }

    return {
        toView: toView,
        inView: inView
    };
})
.factory('sanitize', ['JSONKit',
    function (JSONKit) {
        var San = Sanitize,
            config = San.Config,
            sanitize = [
                new San({}),
                new San(config.RESTRICTED),
                new San(config.BASIC),
                new San(config.RELAXED)
            ];
        // level: 0, 1, 2, 3
        return function (html, level) {
            var innerDOM = document.createElement('div'),
                outerDOM = document.createElement('div');
            level = level >= 0 ? level : 3;
            innerDOM.innerHTML = JSONKit.toStr(html);
            outerDOM.appendChild(sanitize[level].clean_node(innerDOM));
            return outerDOM.innerHTML;
        };
    }
])
.factory('isVisible', function () {
    return function (element) {
        var rect = element[0].getBoundingClientRect();
        return Boolean(rect.bottom - rect.top);
    };
})
.factory('applyFn', ['$rootScope', function ($rootScope) {
        return function (fn, scope) {
            fn = angular.isFunction(fn) ? fn : angular.noop;
            scope = scope && scope.$apply ? scope : $rootScope;
            fn();
            if (!scope.$$phase) {
                scope.$apply();
            }
        };
    }
])
.factory('timing', ['$rootScope', '$q', '$exceptionHandler',
    function ($rootScope, $q, $exceptionHandler) {
        function timing(fn, delay, times) {
            var timingId, count = 0,
                defer = $q.defer(),
                promise = defer.promise;

            fn = angular.isFunction(fn) ? fn : angular.noop;
            delay = parseInt(delay, 10);
            times = parseInt(times, 10);
            times = times >= 0 ? times : 0;
            timingId = window.setInterval(function () {
                count += 1;
                if (times && count >= times) {
                    window.clearInterval(timingId);
                    defer.resolve(fn(count, times, delay));
                } else {
                    try {
                        fn(count, times, delay);
                    } catch (e) {
                        defer.reject(e);
                        $exceptionHandler(e);
                    }
                }
                if (!$rootScope.$$phase) {
                    $rootScope.$apply();
                }
            }, delay);

            promise.$timingId = timingId;
            return promise;
        }
        timing.cancel = function (promise) {
            if (promise && promise.$timingId) {
                clearInterval(promise.$timingId);
                return true;
            } else {
                return false;
            }
        };
        return timing;
    }
])
.factory('promiseGet', ['$q',
    function ($q) {
        return function (param, restAPI, cacheId, cache) {
            var result, defer = $q.defer();

            result = cacheId && cache && cache.get(cacheId);
            if (result) {
                defer.resolve(result);
            } else {
                restAPI.get(param, function (data) {
                    if (cacheId && cache) {
                        cache.put(cacheId, data.data);
                    }
                    defer.resolve(data.data);
                }, function (data) {
                    defer.reject(data);
                });
            }
            return defer.promise;
        };
    }
])
.factory('toast', ['$log', 'JSONKit', function ($log, JSONKit) {
        var toast = {},
            methods = ['info', 'error', 'success', 'warning'];

        angular.forEach(methods, function (x) {
            toast[x] = function (message, title) {
                var log = $log[x] || $log.log;
                title = JSONKit.toStr(title);
                log(message, title);
                message = angular.isObject(message) ? angular.toJson(message) : JSONKit.toStr(message);
                toastr[x](message, title);
            };
        });
        toastr.options = angular.extend({
            positionClass: 'toast-bottom-full-width'
        }, toast.options);
        toast.clear = toastr.clear;
        return toast;
    }
])
.factory('param', function () {
    return $.param;
})
.factory('CryptoJS', function () {
    return window.CryptoJS;
})
.factory('utf8', function () {
    return window.utf8;
})
.factory('store', function () {
    return window.store;
})
.factory('JSONKit', function () {
    return window.JSONKit;
})
// .factory('confirmDialog', ['ModalService',
//     function(ModalService) {
//         return function(modalcontent,true_callback, false_callback) {
//             ModalService.showModal({
//                 templateUrl:'confirmDialog.html',
//                 controller:'confirmController'
//             }).then(function(modal) {
//                 modal.element.modal({backdrop: 'static'});
//                 modal.scope.modalTitle = modalcontent.message;
//                 modal.scope.name = modalcontent.name;
//                 modal.scope.icon = modalcontent.icon;
//                 console.log(modalcontent.icon);
//                 modal.scope.isConfirmDialog = true;
//                 modal.close.then(function(result) {
//                     (result ? true_callback : false_callback)();
//                 });
//             });
//         };
// }]).factory('alertDialog', ['ModalService', function(ModalService) {
//         return function(modalTitle) {
//             ModalService.showModal({
//                 templateUrl:'confirmDialog.html',
//                 controller:'confirmController'
//             }).then(function(modal) {
//                 modal.element.modal();
//                 modal.scope.modalTitle = modalTitle;
//                 modal.scope.isAlertDialog = true;
//                 modal.close.then();
//             });
//         };
// }])
    .factory('GetDateStr', function() {
    return function(AddDayCount) {
        var dd = new Date();
        if(AddDayCount !== "-1") {
            dd.setDate(dd.getDate()-AddDayCount);//获取AddDayCount天前的日期
        }
        var y = dd.getFullYear();
        var m = dd.getMonth()+1;//获取当前月份的日期
        var d =  AddDayCount !== '-1' ? dd.getDate() : 1;
        if(m <10){
           m = "0"+m;
        }
        if(d <10){
           d = "0"+d;
        }
        return y+"-"+m+"-"+d;
    };
}).factory('highchartsDefaultOptions', function() {
    var options = {
            title: {
                text: '',
                x: -20 //center
            },
            subtitle: {
                text: '',
                x: -20
            },
            xAxis: {
                categories : ''
            },
            yAxis: {
                title: {
                    text: '次数'
                },
                plotLines: [{
                    value: 0,
                    width: 1,
                    color: '#808080'
                }]
            },
            tooltip: {
                valueSuffix: '次'
            },
            credits: {
                enabled: false
            },
            series : ''
        };
    var init = function() {
        return options;
    };
    return init;
}).factory('highchartsDashBoardOptions', function() {
    var options = {
        chart: {
            type: 'line'
        },
        title: {
            text: '近三日推广应用安装数'
        },
        xAxis: {
            categories: 'icon,banner,interstitial,native,video,offer,more,push'
        },
        yAxis: {
            title: {
                text: '安装数 (个)'
            }
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle'
        },
        plotOptions: {
            line: {
                dataLabels: {
                    enabled: true          // 开启数据标签
                },
                enableMouseTracking: true // 关闭鼠标跟踪，对应的提示框、点击事件会失效
            }
        },
        series : ''
    };
    var init = function() {
        return options;
    };
    return init;
}).factory('pieChartOptions', function() {
    var options = {
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: 'pie'
        },
        title: {
            text: '安装来源比例'
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.y}</b>'
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:.1f}%'
                }
            }
        },
        credits: {
            enabled: false
        },
        series: [{
            name: '数量',
            colorByPoint: true,
            data: []
        }]
    };
    var init = function() {
        return options;
    };
    return init;
}).factory('Highcharts', function() {
    return window.Highcharts;
}).factory('transformToPieData', function() {
    return function(originData) {
        if(!angular.isArray(originData) || originData.length === 0) {
            return[];
        }
        var data = [];
        for(var i = 0; i < originData.length; i++) {
            data[i] = {};
            data[i].name = originData[i].source;
            data[i].y = originData[i].total;
        }
        return data;
    };
}).factory('slicePicData', function() {
    return function(originData, pubid) {
        var data = originData;
        for(var i = 0, len = data.length; i < len; i++) {
            data[i].resShortName = data[i].res.slice(data[i].res.lastIndexOf('/') + 1);
            if(data[i].resShortName.indexOf(pubid) > 0) {
                data[i].resShortName = data[i].resShortName.replace(pubid + '_', '');
            }
        }
        return data;
    };
}).factory('Excel',function($window){
    var uri='data:application/vnd.ms-excel;base64,',
        template='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>{table}</table></body></html>',
        base64=function(s){return $window.btoa(unescape(encodeURIComponent(s)));},
        format=function(s,c){return s.replace(/{(\w+)}/g,function(m,p){return c[p];})};
    return {
        tableToExcel:function(tableId,worksheetName){
            var table=$(tableId),
                ctx={worksheet:worksheetName,table:table.html()},
                href=uri+base64(format(template,ctx));
            return href;
        }
    };
});
'use strict';

angular.module('genTemplates', []).run(['$templateCache', function($templateCache) {

  $templateCache.put('appAdPolymerEdit.html', '<div class="panel panel-default" id="adPolymer"><div class="panel-heading"><p class="panel-title"><span>聚合广告组名：</span> <input class="searchInput" style="width:300px;" ng-model="name"></p></div><div class="panel-body"><div ng-jsoneditor ng-model="adContent" options="options"></div><p>包含的应用:</p><div class="form-group" ng-class="{wraps:adApps.length !== 0}"><label ng-repeat="app in adApps" class="btn btn-default" ng-click="delAppFromOwn(app)">{{app.name}}</label></div><p>未添加的应用:</p><div class="wraps form-group" ng-class="{wraps: isGroupShow}"><div ng-repeat="group in groups" class="form-group" ng-show="group.linkidChecked"><p><span class="badge">应用组:{{group.linkid}}</span> <button ng-click="selectAppGroup(group.linkid)">全选</button></p><label class="btn btn-default" ng-show="app.checked" ng-repeat="app in group.apps" ng-click="addAppToOwn(app)">{{app.name}}</label></div></div><div class="text-right"><button ng-if="isAddNewAdGroup" class="btn btn-info" ng-click="addAdGroup()">保&nbsp;&nbsp;存</button> <button ng-if="!isAddNewAdGroup" class="btn btn-info" ng-click="updateAdGroup()">保&nbsp;&nbsp;存</button></div></div></div>');

  $templateCache.put('appAdStrategy.html', '<div class="panel panel-default form-group"><div class="panel-heading cursor_p clearfix"><input type="search" ng-model="condition.query" placeholder="按app名称搜索" class="searchInput" ng-model-options="{debounce:{default:1000,blur:0}}"><select class="cursor_p searchInput pull-right" ng-model="condition.linkid" ng-options="linkid.linkid as linkid.linkid for linkid in linkids"><option value>--全部分组--</option></select><select class="cursor_p searchInput pull-right" ng-model="condition.mark" style="width: 150px;color: #686868"><option value>--全部标记--</option><option value="1" style="background: red;">--红色--</option><option value="2" style="background: orange">--橙色--</option><option value="3" style="background: yellow">--黄色--</option><option value="4" style="background: green">--绿色--</option><option value="5" style="background: cyan">--青色--</option><option value="6" style="background: blue">--蓝色--</option><option value="7" style="background: purple">--紫色--</option></select></div><div class="panel-body" ng-if="apps.length !== 0"><table class="table table-bordered table-hover"><tr class="tableTitle listCont"><td>ICON</td><td>应用名称</td><td>应用包名/iTunesid</td><td>APPKEY</td><td>应用组</td><td>控制项</td><td ng-if="adAuth === \'1\'">广告策略</td></tr><tr ng-repeat="app in apps" class="listCont"><td class="cursor_p"><img ngf-src="app.icon||\'img/1.png\'"></td><td ng-if="app.mark === undefined || app.mark === null || app.mark === \'0\'">{{app.name}}</td><td ng-if="app.mark !== undefined && app.mark !== null && app.mark !== \'0\'" class="mark-{{app.mark}}">{{app.name}}</td><td>{{app.pkgname}}</td><td>{{app.appkey}}</td><td>{{app.linkid}}</td><td><a href data-toggle="modal" ng-click="showAdStrategyModal(app.ad, app.appkey, app.name)" data-target="#adId">广告id</a>&nbsp;&nbsp;&nbsp; <a href ng-if="adAuth === \'0\'" data-toggle="modal" ng-click="showAdStrategyModal(app.ad, app.appkey, app.name)" data-target="#adsStrategy">广告策略</a> <a ng-if="user.timingTaskAuth === \'1\' && (!isSubAccount || jurisdiction.timingTask)" ui-sref="index.appTimingTask({appkey: app.appkey})">&nbsp;&nbsp;&nbsp;定时任务</a></td><td ng-if="adAuth === \'1\'"><a href ng-if="app.ad.strategy.native !== undefined" data-toggle="modal" ng-click="showAdStrategyModal(app.ad, app.appkey, app.name, \'all\')" data-target="#adStrategyNodeModel">all</a>&nbsp;&nbsp;&nbsp; <a href ng-if="app.ad.strategy.native !== undefined" data-toggle="modal" ng-click="showAdStrategyModal(app.ad, app.appkey, app.name, \'native\')" data-target="#adStrategyNodeModel">native</a>&nbsp;&nbsp;&nbsp; <a href ng-if="app.ad.strategy.interstitial !== undefined" data-toggle="modal" ng-click="showAdStrategyModal(app.ad, app.appkey, app.name, \'interstitial\')" data-target="#adStrategyNodeModel">interstitial</a>&nbsp;&nbsp;&nbsp; <a href ng-if="app.ad.strategy.banner !== undefined" data-toggle="modal" ng-click="showAdStrategyModal(app.ad, app.appkey, app.name, \'banner\')" data-target="#adStrategyNodeModel">banner</a>&nbsp;&nbsp;&nbsp; <a href ng-if="app.ad.strategy.video !== undefined" data-toggle="modal" ng-click="showAdStrategyModal(app.ad, app.appkey, app.name, \'video\')" data-target="#adStrategyNodeModel">video</a>&nbsp;&nbsp;&nbsp; <a href data-toggle="modal" ng-click="showAdStrategyModal(app.ad, app.appkey, app.name, \'idext\')" data-target="#adStrategyNodeModel">idext</a></td></tr></table></div></div><nav class="text-right" gen-pagination="pagination"></nav><p class="nothing" ng-if="apps.length == 0">暂无数据信息</p><div class="modal fade" id="adsStrategy" ng-class="{height100: adAuth ===\'1\'}"><div class="modal-content" ng-class="{\'height100\': adAuth ===\'1\', \'modal-dialog\':adAuth ===\'0\'}"><div class="modal-header"><p>应用名:{{appname}} <a class="close" data-dismiss="modal">×</a></p></div><div class="clearfix" ng-if="adAuth === \'0\'"><label class="col-sm-3 control-label text-right">广告策略：</label><div class="col-sm-8"><select type="text" class="form-control cursor_p" ng-model="ad.adStrategyId" ng-options="ad._id.$oid as ad.name for ad in adStrategys"></select></div></div><div class="modal-body height100" ng-if="adAuth === \'1\'"><div class="clearfix height100"><div class="modal-body height100"><div ng-jsoneditor ng-model="ad.strategy" options="options" style="height: 92%;"></div></div></div></div><div class="modal-footer" ng-if="adAuth === \'0\'"><button class="btn btn-info" ng-click="updataAdStrategys(ad.strategy)">保&nbsp;&nbsp;存</button></div><div class="modal-footer" ng-if="adAuth === \'1\'"><button class="btn btn-info returnJson" ng-click="updataAdStrategys(ad.strategy)">保&nbsp;&nbsp;存</button></div></div></div><div class="modal fade" id="adId"><div class="modal-content height100"><div class="modal-header"><p>应用名:{{appname}} <a class="close" data-dismiss="modal">×</a></p></div><div class="modal-body" style="height: 80%"><div class="clearfix height100"><div class="modal-body height100"><div ng-jsoneditor ng-model="ad.id" options="options" class="height100"></div></div></div></div><div class="modal-footer" style="height: 20%"><button class="btn btn-info" ng-click="updataAdId(ad.id)">保&nbsp;&nbsp;存</button></div></div></div><div class="modal fade" id="adStrategyNodeModel" style="width:100%;height:100%;overflow:auto;"><div class="modal-content" style="padding: 20px;"><ul class="nav nav-tabs"><li class="active"><a data-toggle="tab" href ng-click="setAnchor(0)">修改</a></li><li><a data-toggle="tab" href ng-click="setAnchor(1)">追加</a></li></ul><div class="tab-pane fade in active"><div ng-show="anchor==0"><div class="modal-header"><button class="btn btn-info" ng-click="updataAdStrategys(ad.strategy)">保&nbsp;&nbsp;存</button> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: red">注：请将权重weight设置在-1和10000之间！</span> <a class="close" data-dismiss="modal">×</a></div><div class="modal-body clearfix"><div class="clearfix"><div><div ng-if="adStrategyNodeType === \'all\'" ng-jsoneditor ng-model="ad.strategy" options="options"></div><div ng-if="adStrategyNodeType === \'native\'" ng-jsoneditor ng-model="ad.strategy.native" options="options"></div><div ng-if="adStrategyNodeType === \'interstitial\'" ng-jsoneditor ng-model="ad.strategy.interstitial" options="options"></div><div ng-if="adStrategyNodeType === \'banner\'" ng-jsoneditor ng-model="ad.strategy.banner" options="options"></div><div ng-if="adStrategyNodeType === \'video\'" ng-jsoneditor ng-model="ad.strategy.video" options="options"></div><div ng-if="adStrategyNodeType === \'idext\'" ng-jsoneditor ng-model="ad.strategy.idext" options="options"></div></div></div></div></div><div ng-show="anchor==1"><div class="modal-header"><button class="btn btn-info" ng-click="appendAdStrategys(nodeValue)">追&nbsp;&nbsp;加</button> &nbsp;&nbsp;<div class="btn-group" ng-if="adStrategyNodeType == \'all\'"><button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">{{nodeType==null?\'请选择节点\':nodeType}} <span class="caret"></span></button><ul class="dropdown-menu" role="menu"><li><a href ng-click="setNodeType(\'native\')">native</a></li><li><a href ng-click="setNodeType(\'interstitial\')">interstitial</a></li><li><a href ng-click="setNodeType(\'banner\')">banner</a></li><li><a href ng-click="setNodeType(\'video\')">video</a></li><li><a href ng-click="setNodeType(\'idext\')">idext</a></li></ul></div><div class="btn-group" ng-if="adStrategyNodeType != \'all\'"><button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">{{adStrategyNodeType}} <span class="caret"></span></button></div><a class="close" data-dismiss="modal">×</a></div><div class="modal-body"><div ng-jsoneditor ng-model="nodeValue" options="options"></div></div></div></div><div style="border: 1px solid #ccc;"><div class="form-group clearfix" style="border-bottom:1px solid #ccc;padding:10px 0 10px 20px;line-height: 40px;">将以上修改同时应用于：&nbsp;&nbsp; <input type="checkbox" class="cursor_p" ng-checked="selectAllFlag" ng-click="selectAll()">&nbsp;全选 <input type="search" ng-model="condition1.query" placeholder="按app名称搜索" class="searchInput pull-right" ng-model-options="{debounce:{default:1000,blur:0}}" style="margin-right: 20px;"></div><div class="geoPanel" style="padding-left:20px;"><div ng-repeat="group in groups" class="form-group"><p ng-if="group.apps.length !==0"><span class="badge">应用组:{{group.linkid}}</span></p><label class="btn btn-default mark-{{app.mark}}" ng-class="{selected: app.checked}" ng-repeat="app in group.apps" ng-click="addToMyApp(app)">{{app.name}}</label></div></div></div></div></div>');

  $templateCache.put('appAndCampaignLog.html', '<div class="panel panel-default form-group"><div class="panel-heading cursor_p clearfix"><p class="panel-title"><input type="search" ng-model="condition.search" placeholder="按app名称搜索" class="searchInput" ng-model-options="{debounce:{default:1000,blur:0}}"><select class="cursor_p searchInput" ng-model="searchh.mark" style="width: 150px;color: #686868"><option value>--状态查询--</option><option value="1" style="color: red;">--正在发布--</option><option value="2" style="color: green">--发布完成--</option></select><span class="pull-right"><span class="glyphicon glyphicon-calendar" style="font-size: 24px;color:#787878;position: relative;top:7px;"></span><input class="searchInput cursor_p" type="text" readonly name="reservation" id="reservation" placeholder="根据时间搜索"></span></p></div><div class="panel-body" ng-if="list.length !==0"><table class="table table-bordered table-hover"><tr class="tableTitle"><td class="td_width80">序列</td><td>ICON</td><td>名称</td><td>appkey</td><td>info</td><td>应用组</td><td>平台</td><td>状态</td><td>更新时间</td></tr><tr ng-repeat="res in list | filter:search" class="text-center"><td class="td_width80">{{$index + 1}}</td><td><img ngf-src="res.icon||\'img/1.png\'" height="32" width="32"></td><td ng-if="res.status === \'2\'" style="color: red;">{{res.name}}</td><td ng-if="res.status === \'1\'" style="color: green;">{{res.name}}</td><td>{{res.appkey}}</td><td>{{res.info}}</td><td>{{res.linkid}}</td><td ng-if="res.platform === \'1\'">Android</td><td ng-if="res.platform === \'2\'">IOS</td><td class="td_width180" ng-if="res.status === \'1\'" style="color: green;">发布完成!</td><td class="td_width180" ng-if="res.status === \'2\'" style="color: red;">正在发布...</td><td>{{res.utime}}</td></tr></table></div></div><nav class="text-left">注：默认显示近2小时数据</nav><nav class="text-right" gen-pagination="pagination"></nav><p class="nothing" ng-if="list.length == 0">暂无资源信息</p>');

  $templateCache.put('appAndCampaignSyn.html', '<div class="panel-group" id="accordions"><div class="panel panel-default"><div class="panel-heading clearfix"><select class="cursor_p searchInput pull-right" ng-model="search.linkid" ng-options="linkid.linkid as linkid.linkid for linkid in linkids"><option value>--全部分组--</option></select><select class="cursor_p searchInput pull-right" ng-model="search.mark" style="width: 150px;color: #686868"><option value>--全部标记--</option><option value="1" style="background: red;">--红色--</option><option value="2" style="background: orange">--橙色--</option><option value="3" style="background: yellow">--黄色--</option><option value="4" style="background: green">--绿色--</option><option value="5" style="background: cyan">--青色--</option><option value="6" style="background: blue">--蓝色--</option><option value="7" style="background: purple">--紫色--</option></select></div><div class="panel-body" ng-if="apps.length !== 0"><table class="table table-bordered table-hover"><tr class="tableTitle"><td>ICON</td><td>应用名称</td><td>info</td><td>应用分组</td><td>操作</td></tr><tr ng-repeat="app in appList" class="listCont"><td><img ngf-src="app.icon||\'img/100991_icon_01.png\'"></td><td ng-if="app.mark === undefined || app.mark === null || app.mark === \'0\'">{{app.name}}</td><td ng-if="app.mark !== undefined && app.mark !== null && app.mark !== \'0\'" class="mark-{{app.mark}}">{{app.name}}</td><td>{{app.info}}</td><td>{{app.linkid}}</td><td class="cursor_p"><input type="checkbox" ng-checked="app.isSelect" ng-click="selectApp($index)">&nbsp;&nbsp;勾选&nbsp;&nbsp;</td></tr></table><div class="form-group"><input type="checkbox" ng-checked="isSelectLinkid" ng-click="selectLinkid()" class="cursor_p">&nbsp;&nbsp;发布当前的分组应用</div><div class="clearfix"><button class="btn btn-info" data-target="#appSyn" ng-click="showModal()" data-toggle="modal">发&nbsp;&nbsp;布</button></div></div></div><nav class="text-right" gen-pagination="pagination"></nav><p class="nothing" ng-if="apps.length == 0">暂无数据信息</p><div class="modal fade" id="appSyn"><div class="modal-content modal-dialog"><div class="modal-header"><p><a class="close" data-dismiss="modal">×</a></p></div><div class="modal-body"><div class="clearfix form-group"><label class="col-sm-3 control-label text-right">发布原因：</label><div class="col-sm-8"><textarea rows="8" class="form-control" ng-model="reason"></textarea></div></div><div ng-if="errorShow" ng-repeat="error in errors"><p class="text-center">{{error.error}}</p></div></div><div class="modal-footer"><button class="btn btn-info" ng-click="syn()">确&nbsp;&nbsp;定</button></div></div></div></div>');

  $templateCache.put('appAndCampaignSynInfo.html', '<button class="btn btn-info" ng-if="upload" ng-click="newSynInfo()">刷新发布信息</button><p ng-if="showDelaytime">预计发布所需时间:<strong>{{second}}</strong>秒,请耐心等待!</p><div class="panel-body" ng-if="list.length !== 0"><table class="table table-bordered table-hover"><tr class="tableTitle"><td>icon</td><td class="td_width120">name</td><td class="td_width120">状态</td><td>信息</td></tr><tr ng-repeat="info in list" class="listCont"><td><img ngf-src="info.icon||\'img/100991_icon_01.png\'"></td><td class="td_width120">{{info.name}}</td><td class="td_width120" ng-if="info.status === \'0\'">等待发布</td><td class="td_width180" ng-if="info.status === \'1\'">发布完成!</td><td class="td_width180" ng-if="info.status === \'2\'">正在发布...</td><td>{{info.info}}</td></tr></table></div><nav class="text-right" gen-pagination="pagination"></nav>');

  $templateCache.put('appBascInfo.html', '<div class="panel panel-default form-group"><div class="panel-heading cursor_p clearfix"><input type="search" ng-model="condition.query" placeholder="按app名称搜索" class="searchInput" ng-model-options="{debounce:{default:1000,blur:0}}"><select class="cursor_p searchInput pull-right" ng-model="condition.linkid" ng-options="linkid.linkid as linkid.linkid for linkid in linkids"><option value>--全部分组--</option></select><select class="cursor_p searchInput pull-right" ng-model="condition.mark" style="width: 150px;color: #686868"><option value>--全部标记--</option><option value="1" style="background: red;">--红色--</option><option value="2" style="background: orange">--橙色--</option><option value="3" style="background: yellow">--黄色--</option><option value="4" style="background: green">--绿色--</option><option value="5" style="background: cyan">--青色--</option><option value="6" style="background: blue">--蓝色--</option><option value="7" style="background: purple">--紫色--</option></select></div><div class="panel-body" ng-if="apps.length !== 0"><table class="table table-bordered table-hover"><tr class="tableTitle listCont"><td>ICON</td><td>应用名称</td><td>应用包名/iTunesid</td><td>最新SDK版本</td><td>APPKEY</td><td>应用组</td><td>控制项</td><td>操作</td></tr><tr ng-repeat="app in apps" class="listCont"><td class="cursor_p"><img ngf-src="app.icon||\'img/1.png\'" ng-click="showColorTag(app.name, app.appkey, app.mark)" data-toggle="modal" data-target="#colorTag"></td><td ng-if="app.mark === undefined || app.mark === null || app.mark === \'0\'" title="创建时间:{{app.ctime}}">{{app.name}}</td><td ng-if="app.mark !== undefined && app.mark !== null && app.mark !== \'0\'" class="mark-{{app.mark}}" title="创建时间:{{app.ctime}}">{{app.name}}</td><td ng-if="isSubAccount"><span>{{app.pkgname}}</span></td><td ng-if="!isSubAccount"><span>{{app.pkgname}}</span>&nbsp;&nbsp; <a href style="float:right;" class="cursor_p glyphicon glyphicon-copy" ng-click="selectTransferApp(app.appkey, app.name)" title="应用迁移" data-toggle="modal" data-target="#userselector"></a></td><td title="最新SDK版本:{{latestSDKV}},如果您的当前版本过低，建议升级SDK版本">{{app.sdkv}}</td><td>{{app.appkey}}</td><td><a href data-toggle="modal" ng-click="showAppLinkidModal(app.linkid, $index)" data-target="#appLinkid">{{app.linkid}}</a></td><td><a ui-sref="index.paramCtrl({appkey: app.appkey})">控制参数</a>&nbsp;&nbsp;&nbsp; <a ui-sref="index.paramInject({appkey: app.appkey})">注入参数</a>&nbsp;&nbsp;&nbsp; <a ui-sref="index.paramCustom({appkey: app.appkey})">自定义参数</a>&nbsp;&nbsp;&nbsp;</td><td><a ui-sref="index.appModify({appkey: app.appkey})" class="glyphicon glyphicon-edit">编辑</a>&nbsp;&nbsp; <a ng-click="selectDelApp(app.appkey, app.name, $index)" data-toggle="modal" data-target="#checkPassword" class="glyphicon glyphicon-remove cursor_p">删除</a>&nbsp;&nbsp; <a ng-if="platform === \'1\'" href="https://play.google.com/store/apps/details?id={{app.pkgname}}" target="_blank" class="glyphicon glyphicon-link">市场</a> <a ng-if="platform === \'2\'" href="https://itunes.apple.com/cn/app/id{{app.pkgname}}" target="_blank" class="glyphicon glyphicon-link">市场</a></td></tr></table></div></div><nav class="text-right" gen-pagination="pagination"></nav><p class="nothing" ng-if="apps.length == 0">暂无数据信息</p><div class="modal fade" id="appLinkid"><div class="modal-content modal-dialog"><div class="modal-header"><p><span>应用名:{{appName}}</span> <a class="close" data-dismiss="modal">×</a></p></div><div class="modal-body"><div class="clearfix"><label class="col-sm-3 control-label text-right">应用组：</label><div class="col-sm-8"><select type="text" class="form-control cursor_p" ng-model="selectedApp.linkid" ng-change="updateAppLinkid()" ng-options="linkid.linkid as linkid.linkid for linkid in linkids" style="border:none;width:100%;"></select></div></div></div><div class="modal-footer"></div></div></div><div class="modal fade" id="colorTag"><div class="modal-content modal-dialog"><div class="modal-header"><p><span>应用名:{{appName}}</span> <a class="close" data-dismiss="modal">×</a></p><p>选择一种您钟爱的颜色做标记</p></div><div class="modal-body"><ul class="colorPicker"><li ng-class="{colorChecked: tag.mark === \'1\'}" ng-click="selectFlag(\'1\')"></li><li ng-class="{colorChecked: tag.mark === \'2\'}" ng-click="selectFlag(\'2\')"></li><li ng-class="{colorChecked: tag.mark === \'3\'}" ng-click="selectFlag(\'3\')"></li><li ng-class="{colorChecked: tag.mark === \'4\'}" ng-click="selectFlag(\'4\')"></li><li ng-class="{colorChecked: tag.mark === \'5\'}" ng-click="selectFlag(\'5\')"></li><li ng-class="{colorChecked: tag.mark === \'6\'}" ng-click="selectFlag(\'6\')"></li><li ng-class="{colorChecked: tag.mark === \'7\'}" ng-click="selectFlag(\'7\')"></li></ul></div><div class="modal-footer"><button class="btn btn-info" data-dismiss="modal" ng-click="setAppMarke()">保&nbsp;&nbsp;存</button> <button class="btn btn-info" data-dismiss="modal" ng-click="delAppMarke()">清&nbsp;&nbsp;除</button></div></div></div><div class="modal fade" id="userselector"><div class="modal-content modal-dialog"><div class="modal-header"><p><a class="close" data-dismiss="modal">×</a></p><p>被迁移的应用:{{appName}}</p></div><div class="form-group clearfix"><label class="control-label col-md-3 text-right">输入目标账号：</label><div class="col-md-8"><input class="form-control" ng-model="login_id"></div></div><div class="form-group clearfix"><label class="control-label col-md-3 text-right">当前账户密码：</label><div class="col-md-8"><input type="password" class="form-control" ng-model="selfPassword"></div></div><div class="modal-footer"><button class="btn btn-info" ng-click="transferApp()">确&nbsp;&nbsp;定</button></div></div></div><div class="modal fade" id="checkPassword"><div class="modal-content modal-dialog"><div class="modal-header"><p><a class="close" data-dismiss="modal">×</a></p><p>被删除的应用:{{appName}}</p></div><div class="form-group clearfix"><label class="control-label col-md-3 text-right">当前账户密码：</label><div class="col-md-8"><input type="password" class="form-control" ng-model="selfPassword"></div></div><div class="modal-footer"><button class="btn btn-info" ng-click="removeApp()">确&nbsp;&nbsp;定</button></div></div></div><div class="modal fade" id="APPCampaign"><div class="modal-content modal-dialog"><div class="modal-header"><p>应用名:{{appName}} <a class="close" data-dismiss="modal">×</a></p></div><div class="modal-body"><div class="clearfix"><div class="modal-body"><div ng-jsoneditor ng-model="campaign" options="options" class="height300"></div></div></div></div><div class="modal-footer"><button class="btn btn-info" ng-click="updateAppCampaign()">保&nbsp;&nbsp;存</button></div></div></div>');

  $templateCache.put('appInsert.html', '<div ng-jsoneditor ng-model="data" options="options" class="jsontxt"></div><div class="form-group jsoneditor-form" style="position: relative"><ng-file-input mode="text" callback="callback(file)" class="ng-file-input"></ng-file-input><button class="btn btn-info btn-s" style="position: absolute; top: -4px;" ng-click="submit()">获取APPKEY</button> <button class="btn btn-info btn-s" style="position: absolute; top: -4px; left: 220px;" data-toggle="modal" data-target="#fullpage">全&nbsp;&nbsp;屏</button></div><div class="bg-danger clearfix panel-body" ng-if="errors.length != 0"><p style="text-indent: 10px;" class="text-danger" ng-repeat="error in errors">error : {{error.error}}</p></div><div class="modal fade height100" id="fullpage"><div class="modal-content height100"><div class="modal-body height100"><div ng-jsoneditor ng-model="data" options="options" class="jsontxt height100"></div></div><button class="btn btn-info returnJson" data-dismiss="modal">返&nbsp;&nbsp;回</button></div></div>');

  $templateCache.put('appKey.html', '<div class="row"><div class="col-sm-12"><div class="panel panel-default"><div class="panel-heading"><p ng-if="platform == \'1\'">Android 唯一APPKEY为：</p><p ng-if="platform == \'2\'">iOS 唯一APPKEY为：</p><p ng-if="platform == \'3\'">windowsPhone 唯一APPKEY为：</p></div><div class="panel-body" ng-repeat="appkey in appkeys"><div class="popover-content text-center">{{appkey.appkey}}</div></div></div></div></div>');

  $templateCache.put('appLink.html', '<div class="panel panel-default form-group"><div class="panel-heading"><p class="panel-title">应用分组管理</p></div><div class="panel-body"><table class="table table-hover table-bordered"><tr class="tableTitle"><td class="td_width120">序号</td><td>应用组名称</td><td class="text-center">操作</td></tr><tr ng-repeat="linkid in linkids"><td class="td_width120">{{$index + 1}}</td><td>{{linkid.linkid}}</td><td class="text-center" data-toggle="modal" ng-click="showUpdateModal(linkid.linkid)" data-target="#editAppLinkid" style="width:80px;"><a href>编&nbsp;辑</a></td></tr></table></div></div><div class="modal fade" id="editAppLinkid"><div class="modal-content modal-dialog"><div class="modal-header"><p><a class="close" data-dismiss="modal">×</a></p></div><div class="modal-body"><div class="clearfix"><span>应用组名称：</span> <input ng-model="desclinkid" class="searchInput" style="width:480px;"></div></div><div class="modal-footer"><button class="btn btn-info" data-dismiss="modal" ng-click="changeLinkid()">确&nbsp;&nbsp;定</button></div></div></div>');

  $templateCache.put('appModify.html', '<div class="form-group"><div ng-jsoneditor ng-model="app" options="options"></div><button class="btn btn-info" ng-click="submit()">保&nbsp;&nbsp;存</button> <button class="btn btn-info btn-s" data-toggle="modal" data-target="#fullpage">全&nbsp;&nbsp;屏</button></div><div class="bg-danger clearfix panel-body" ng-if="errors.length != 0"><p style="text-indent: 10px;" class="text-danger" ng-repeat="error in errors">error : {{error.error}}</p></div><div class="modal fade height100" id="fullpage"><div class="modal-content height100"><div class="modal-body height100"><div ng-jsoneditor ng-model="app" options="options" class="height100"></div></div><button class="btn btn-info returnJson" data-dismiss="modal">小&nbsp;&nbsp;屏</button></div></div>');

  $templateCache.put('appSyn.html', '<div class="panel-group" id="accordions"><div class="panel panel-default"><div class="panel-heading clearfix"><select class="cursor_p searchInput pull-right" ng-model="search.linkid" ng-options="linkid.linkid as linkid.linkid for linkid in linkids"><option value>--全部分组--</option></select><select class="cursor_p searchInput pull-right" ng-model="search.mark" style="width: 150px;color: #686868"><option value>--全部标记--</option><option value="1" style="background: red;">--红色--</option><option value="2" style="background: orange">--橙色--</option><option value="3" style="background: yellow">--黄色--</option><option value="4" style="background: green">--绿色--</option><option value="5" style="background: cyan">--青色--</option><option value="6" style="background: blue">--蓝色--</option><option value="7" style="background: purple">--紫色--</option></select></div><div class="panel-body" ng-if="apps.length !== 0"><table class="table table-bordered table-hover"><tr class="tableTitle"><td>ICON</td><td>应用名称</td><td>APPKEY</td><td>应用分组</td><td>操作</td></tr><tr ng-repeat="app in appList" class="listCont"><td><img ngf-src="app.icon||\'img/100991_icon_01.png\'"></td><td ng-if="app.mark === undefined || app.mark === null || app.mark === \'0\'">{{app.name}}</td><td ng-if="app.mark !== undefined && app.mark !== null && app.mark !== \'0\'" class="mark-{{app.mark}}">{{app.name}}</td><td>{{app.appkey}}</td><td>{{app.linkid}}</td><td class="cursor_p"><input type="checkbox" ng-checked="app.isSelect" ng-click="selectApp($index)">&nbsp;&nbsp;勾选&nbsp;&nbsp;</td></tr></table><div class="form-group"><input type="checkbox" ng-checked="isSelectLinkid" ng-click="selectLinkid()" class="cursor_p">&nbsp;&nbsp;发布当前的分组应用</div><div class="clearfix"><button class="btn btn-info" data-target="#appSyn" ng-click="showModal()" data-toggle="modal">发&nbsp;&nbsp;布</button> <button class="btn btn-info" ng-if="upload" ng-click="newSynInfo()">刷新发布信息</button></div></div></div><nav class="text-right" gen-pagination="pagination"></nav><div class="panel-body" ng-if="list.length !== 0"><p>发布状态信息：</p><div class="spinner listCont" ng-repeat="syninfo in list"><p style="display: inline-block">{{syninfo.info}}</p><div style="display: inline-block" ng-if="!syninfo.pubid"><div class="bounce1 bounce"></div><div class="bounce2 bounce"></div><div class="bounce3 bounce"></div><div class="bounce4 bounce"></div><div class="bounce5 bounce"></div><div class="bounce6 bounce"></div></div></div></div><p class="nothing" ng-if="apps.length == 0">暂无数据信息</p><div class="modal fade" id="appSyn"><div class="modal-content modal-dialog"><div class="modal-header"><p><a class="close" data-dismiss="modal">×</a></p></div><div class="modal-body"><div class="clearfix form-group"><label class="col-sm-3 control-label text-right">发布原因：</label><div class="col-sm-8"><textarea rows="8" class="form-control" ng-model="reason"></textarea></div></div><div ng-if="errorShow" ng-repeat="error in errors"><p class="text-center">{{error.error}}</p></div></div><div class="modal-footer"><button class="btn btn-info" ng-click="syn()">确&nbsp;&nbsp;定</button></div></div></div></div>');

  $templateCache.put('appTestId.html', '<div class="clearfix"><div class="col-sm-12"><div class="panel panel-default" ng-if="platform === \'1\'"><div class="panel-heading"><p>请点击以下链接获取TESTID：</p></div><div class="panel-body clearfix"><div class="popover-content text-center container" style="height:40px;"><a href="http://go2s.co/res/apk/testid.apk"><span class="glyphicon glyphicon-download" id="downLoadIcon"></span>点击下载</a></div></div></div></div></div>');

  $templateCache.put('appTimingTask.html', '<div class="panel panel-default"><div class="panel-heading panel-title"><div class="row clearfix" style="margin-top:5px;"><label class="control-label col-sm-1 text-right">任务名称：</label> <input class="modalInput col-sm-5" ng-model="timingTask.name">&nbsp;&nbsp;&nbsp; <button class="btn btn-info glyphicon glyphicon-plus" ng-click="addStartTask()">新增起始任务节点</button></div></div><div class="panel-body panel" ng-repeat="strategy in timingTask.strategies"><div><div class="row form-group"><label class="control-label text-right col-sm-1">起始时间：</label> <input class="modalInput col-sm-5" ng-model="strategy.sdate" placeholder="2017-03-15 16:30"></div><div class="row form-group"><label class="control-label text-right col-sm-1">结束时间：</label> <input class="modalInput col-sm-5" ng-model="strategy.edate" placeholder="2017-03-15 16:30"></div><div class="row form-group"><label class="control-label text-right col-sm-1">广告策略：</label><select type="text" class="modalInput col-sm-5 cursor_p" ng-model="strategy.adStrategyId" ng-options="ad._id.$oid as ad.name for ad in adStrategys"><option value>请选择广告策略</option></select></div></div><div class="bottomBorder"><span class="glyphicon glyphicon-trash cursor_p" ng-click="delTask($index)"></span>&nbsp;&nbsp; <span class ng-if="strategy.state === \'0\'">未执行</span> <span class ng-if="strategy.state === \'1\'">等待执行</span> <span class ng-if="strategy.state === \'2\'">执行完成</span> <span class ng-if="strategy.state === \'4\'">已过期</span></div></div><div class="panel-footer"><button class="btn btn-info glyphicon glyphicon-plus" ng-click="addEndTask()">新增末尾任务节点</button> <button class="btn btn-info" ng-click="addTimingTask()">开始任务</button></div><div class="bg-danger clearfix panel-body" ng-if="errors.length != 0"><p style="text-indent: 10px;" class="text-danger" ng-repeat="error in errors">error : {{error.error}}</p></div></div>');

  $templateCache.put('basicStatisticsInfo.html', '<div class="panel panel-default form-group statistics-panel"><div class="panel-heading"><p class="panel-title">概况-过去三天数据汇总</p></div><div class="panel-body table-container"><div class="clearfix" style="margin:-4px 0 8px 0;"><div class="app-select-container"><select name="user-select" id="user-select" class="form-control" ng-model="company_name" ng-options="user.pubid as user.company_name for user in usersData"></select></div></div><table class="table table-hover table-bordered"><tr class="tableTitle"><th colspan="10">开发者id:&nbsp;{{userInfo.pubid}}&nbsp;&nbsp;&nbsp;团队名称:&nbsp;{{userInfo.company_name}}</th></tr><tr><th colspan="10">时间:&nbsp;{{userInfo.reps[2].date}}</th></tr><tr style="background:#eaeaea;"><td></td><td><b>banner</b></td><td><b>icon</b></td><td><b>native</b></td><td><b>interstitial</b></td><td><b>push</b></td><td><b>video</b></td><td><b>more</b></td><td><b>offer</b></td><td><b>未知</b></td></tr><tr><td>show</td><td>{{userInfo.reps[2][2][1]}}</td><td>{{userInfo.reps[2][1][1]}}</td><td>{{userInfo.reps[2][4][1]}}</td><td>{{userInfo.reps[2][3][1]}}</td><td>{{userInfo.reps[2][8][1]}}</td><td>{{userInfo.reps[2][5][1]}}</td><td>{{userInfo.reps[2][7][1]}}</td><td>{{userInfo.reps[2][6][1]}}</td><td>{{userInfo.reps[2][0][1]}}</td></tr><tr><td>click</td><td>{{userInfo.reps[2][2][2]}}</td><td>{{userInfo.reps[2][1][2]}}</td><td>{{userInfo.reps[2][4][2]}}</td><td>{{userInfo.reps[2][3][2]}}</td><td>{{userInfo.reps[2][8][2]}}</td><td>{{userInfo.reps[2][5][2]}}</td><td>{{userInfo.reps[2][7][2]}}</td><td>{{userInfo.reps[2][6][2]}}</td><td>{{userInfo.reps[2][0][2]}}</td></tr><tr><td>install</td><td>{{userInfo.reps[2][2][3]}}</td><td>{{userInfo.reps[2][1][3]}}</td><td>{{userInfo.reps[2][4][3]}}</td><td>{{userInfo.reps[2][3][3]}}</td><td>{{userInfo.reps[2][8][3]}}</td><td>{{userInfo.reps[2][5][3]}}</td><td>{{userInfo.reps[2][7][3]}}</td><td>{{userInfo.reps[2][6][3]}}</td><td>{{userInfo.reps[2][0][3]}}</td></tr><tr><td>CTR&nbsp;<span class="glyphicon glyphicon-question-sign" title="点击总数/展示总数"></span></td><td>{{userInfo.reps[2][2].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][2].upclick}}" title="{{userInfo.reps[2][2].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][2].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[2][1].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][1].upclick}}" title="{{userInfo.reps[2][1].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][1].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[2][4].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][4].upclick}}" title="{{userInfo.reps[2][4].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][4].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[2][3].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][3].upclick}}" title="{{userInfo.reps[2][3].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][3].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[2][8].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][8].upclick}}" title="{{userInfo.reps[2][8].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][8].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[2][5].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][5].upclick}}" title="{{userInfo.reps[2][5].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][5].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[2][7].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][7].upclick}}" title="{{userInfo.reps[2][7].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][7].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[2][6].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][6].upclick}}" title="{{userInfo.reps[2][6].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][6].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[2][0].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][0].upclick}}" title="{{userInfo.reps[2][0].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][0].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td></tr><tr><td>CVR&nbsp;<span class="glyphicon glyphicon-question-sign" title="安装总数/点击总数"></span></td><td>{{userInfo.reps[2][2].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][2].upinstall}}" title="{{userInfo.reps[2][2].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][2].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[2][1].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][1].upinstall}}" title="{{userInfo.reps[2][1].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][1].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[2][4].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][4].upinstall}}" title="{{userInfo.reps[2][4].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][4].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[2][3].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][3].upinstall}}" title="{{userInfo.reps[2][3].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][3].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[2][8].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][8].upinstall}}" title="{{userInfo.reps[2][8].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][8].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[2][5].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][5].upinstall}}" title="{{userInfo.reps[2][5].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][5].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[2][7].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][7].upinstall}}" title="{{userInfo.reps[2][7].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][7].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[2][6].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][6].upinstall}}" title="{{userInfo.reps[2][6].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][6].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[2][0].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][0].upinstall}}" title="{{userInfo.reps[2][0].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][0].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td></tr><tr><th colspan="10">时间:&nbsp;{{userInfo.reps[1].date}}</th></tr><tr style="background:#eaeaea;"><td></td><td><b>banner</b></td><td><b>icon</b></td><td><b>native</b></td><td><b>interstitial</b></td><td><b>push</b></td><td><b>video</b></td><td><b>more</b></td><td><b>offer</b></td><td><b>未知</b></td></tr><tr><td>show</td><td>{{userInfo.reps[1][2][1]}}</td><td>{{userInfo.reps[1][1][1]}}</td><td>{{userInfo.reps[1][4][1]}}</td><td>{{userInfo.reps[1][3][1]}}</td><td>{{userInfo.reps[1][8][1]}}</td><td>{{userInfo.reps[1][5][1]}}</td><td>{{userInfo.reps[1][7][1]}}</td><td>{{userInfo.reps[1][6][1]}}</td><td>{{userInfo.reps[1][0][1]}}</td></tr><tr><td>click</td><td>{{userInfo.reps[1][2][2]}}</td><td>{{userInfo.reps[1][1][2]}}</td><td>{{userInfo.reps[1][4][2]}}</td><td>{{userInfo.reps[1][3][2]}}</td><td>{{userInfo.reps[1][8][2]}}</td><td>{{userInfo.reps[1][5][2]}}</td><td>{{userInfo.reps[1][7][2]}}</td><td>{{userInfo.reps[1][6][2]}}</td><td>{{userInfo.reps[1][0][2]}}</td></tr><tr><td>install</td><td>{{userInfo.reps[1][2][3]}}</td><td>{{userInfo.reps[1][1][3]}}</td><td>{{userInfo.reps[1][4][3]}}</td><td>{{userInfo.reps[1][3][3]}}</td><td>{{userInfo.reps[1][8][3]}}</td><td>{{userInfo.reps[1][5][3]}}</td><td>{{userInfo.reps[1][7][3]}}</td><td>{{userInfo.reps[1][6][3]}}</td><td>{{userInfo.reps[1][0][3]}}</td></tr><tr><td>CTR&nbsp;<span class="glyphicon glyphicon-question-sign" title="点击总数/展示总数"></span></td><td>{{userInfo.reps[1][2].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][2].upclick}}" title="{{userInfo.reps[1][2].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][2].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[1][1].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][1].upclick}}" title="{{userInfo.reps[1][1].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][1].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[1][4].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][4].upclick}}" title="{{userInfo.reps[1][4].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][4].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[1][3].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][3].upclick}}" title="{{userInfo.reps[1][3].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][3].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[1][8].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][8].upclick}}" title="{{userInfo.reps[1][8].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][8].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[1][5].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][5].upclick}}" title="{{userInfo.reps[1][5].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][5].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[1][7].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][7].upclick}}" title="{{userInfo.reps[1][7].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][7].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[1][6].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][6].upclick}}" title="{{userInfo.reps[1][6].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][6].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[1][0].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][0].upclick}}" title="{{userInfo.reps[1][0].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][0].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td></tr><tr><td>CVR&nbsp;<span class="glyphicon glyphicon-question-sign" title="安装总数/点击总数"></span></td><td>{{userInfo.reps[1][2].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][2].upinstall}}" title="{{userInfo.reps[1][2].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][2].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[1][1].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][1].upinstall}}" title="{{userInfo.reps[1][1].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][1].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[1][4].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][4].upinstall}}" title="{{userInfo.reps[1][4].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][4].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[1][3].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][3].upinstall}}" title="{{userInfo.reps[1][3].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][3].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[1][8].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][8].upinstall}}" title="{{userInfo.reps[1][8].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][8].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[1][5].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][5].upinstall}}" title="{{userInfo.reps[1][5].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][5].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[1][7].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][7].upinstall}}" title="{{userInfo.reps[1][7].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][7].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[1][6].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][6].upinstall}}" title="{{userInfo.reps[1][6].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][6].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[1][0].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][0].upinstall}}" title="{{userInfo.reps[1][0].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][0].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td></tr><tr><th colspan="10">时间:&nbsp;{{userInfo.reps[0].date}}</th></tr><tr style="background:#eaeaea;"><td></td><td><b>banner</b></td><td><b>icon</b></td><td><b>native</b></td><td><b>interstitial</b></td><td><b>push</b></td><td><b>video</b></td><td><b>more</b></td><td><b>offer</b></td><td><b>未知</b></td></tr><tr><td>show</td><td>{{userInfo.reps[0][2][1]}}</td><td>{{userInfo.reps[0][1][1]}}</td><td>{{userInfo.reps[0][4][1]}}</td><td>{{userInfo.reps[0][3][1]}}</td><td>{{userInfo.reps[0][8][1]}}</td><td>{{userInfo.reps[0][5][1]}}</td><td>{{userInfo.reps[0][7][1]}}</td><td>{{userInfo.reps[0][6][1]}}</td><td>{{userInfo.reps[0][0][1]}}</td></tr><tr><td>click</td><td>{{userInfo.reps[0][2][2]}}</td><td>{{userInfo.reps[0][1][2]}}</td><td>{{userInfo.reps[0][4][2]}}</td><td>{{userInfo.reps[0][3][2]}}</td><td>{{userInfo.reps[0][8][2]}}</td><td>{{userInfo.reps[0][5][2]}}</td><td>{{userInfo.reps[0][7][2]}}</td><td>{{userInfo.reps[0][6][2]}}</td><td>{{userInfo.reps[0][0][2]}}</td></tr><tr><td>install</td><td>{{userInfo.reps[0][2][3]}}</td><td>{{userInfo.reps[0][1][3]}}</td><td>{{userInfo.reps[0][4][3]}}</td><td>{{userInfo.reps[0][3][3]}}</td><td>{{userInfo.reps[0][8][3]}}</td><td>{{userInfo.reps[0][5][3]}}</td><td>{{userInfo.reps[0][7][3]}}</td><td>{{userInfo.reps[0][6][3]}}</td><td>{{userInfo.reps[0][0][3]}}</td></tr><tr><td>CTR&nbsp;<span class="glyphicon glyphicon-question-sign" title="点击总数/展示总数"></span></td><td>{{userInfo.reps[0][2].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][2].upclick}}" title="{{userInfo.reps[0][2].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][2].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[0][1].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][1].upclick}}" title="{{userInfo.reps[0][1].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][1].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[0][4].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][4].upclick}}" title="{{userInfo.reps[0][4].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][4].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[0][3].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][3].upclick}}" title="{{userInfo.reps[0][3].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][3].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[0][8].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][8].upclick}}" title="{{userInfo.reps[0][8].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][8].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[0][5].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][5].upclick}}" title="{{userInfo.reps[0][5].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][5].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[0][7].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][7].upclick}}" title="{{userInfo.reps[0][7].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][7].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[0][6].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][6].upclick}}" title="{{userInfo.reps[0][6].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][6].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[0][0].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][0].upclick}}" title="{{userInfo.reps[0][0].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][0].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td></tr><tr><td>CVR&nbsp;<span class="glyphicon glyphicon-question-sign" title="安装总数/点击总数"></span></td><td>{{userInfo.reps[0][2].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][2].upinstall}}" title="{{userInfo.reps[0][2].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][2].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[0][1].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][1].upinstall}}" title="{{userInfo.reps[0][1].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][1].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[0][4].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][4].upinstall}}" title="{{userInfo.reps[0][4].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][4].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[0][3].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][3].upinstall}}" title="{{userInfo.reps[0][3].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][3].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[0][8].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][8].upinstall}}" title="{{userInfo.reps[0][8].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][8].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[0][5].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][5].upinstall}}" title="{{userInfo.reps[0][5].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][5].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[0][7].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][7].upinstall}}" title="{{userInfo.reps[0][7].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][7].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[0][6].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][6].upinstall}}" title="{{userInfo.reps[0][6].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][6].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[0][0].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][0].upinstall}}" title="{{userInfo.reps[0][0].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][0].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td></tr></table></div></div>');

  $templateCache.put('confirmDialog.html', '<div class="modal fade"><div class="modal-content modal-dialog"><p class="modal-header">温馨提示!!!</p><div class="modal-body text-center"><div class="deleImgWrap" ng-if="icon !== undefined"><img src="{{icon}}"></div><p>{{name}}</p><p>{{modalTitle}}</p></div><div ng-if="isConfirmDialog" class="modal-footer"><button class="btn btn-info" ng-click="close(true)" data-dismiss="modal">确&nbsp;&nbsp;定</button> <button class="btn btn-info" ng-click="close(false)" data-dismiss="modal">取&nbsp;&nbsp;消</button></div></div></div>');

  $templateCache.put('dashboard.html', '<h2><span class="glyphicon glyphicon-home" style="color:#46a3e1">&nbsp;</span>DashBoard</h2><div class="panel panel-default"><div style="width: 100%;height: 200px;"><div style="width: 49%;height: 200px;float: left;margin-left: 1%"><h3 style="padding-left: 20px">统计概况（昨日）：</h3><div style="height:140px;margin-left: 20px;margin-right: 20px;border:1px solid #000000"><div ng-click="toStat()" style="width:30%;height:100px;margin-top: 20px;margin-left: 2.5%;float:left;border:1px solid #000000"><h5 style="text-align: center">推广应用安装总数</h5><h1 style="text-align: center"><a style="text-decoration:none;cursor: pointer">{{installCount}}</a></h1></div><div ng-click="toStat()" style="width:30%;height:100px;margin-top: 20px;margin-left: 2.5%;float:left;border:1px solid #000000"><h5 style="text-align: center">综合CTR</h5><h1 style="text-align: center"><a style="text-decoration:none;cursor: pointer">{{CTR}}</a> <span class="glyphicon glyphicon-arrow-{{CTR_updown}}" title="{{CTR_updown === \'up\' ? \'相比前一天上升\' : CTR_updown === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></h1></div><div ng-click="toStat()" style="width:30%;height:100px;margin-top: 20px;margin-left: 2.5%;float:left;border:1px solid #000000"><h5 style="text-align: center">综合CVR</h5><h1 style="text-align: center"><a style="text-decoration:none;cursor: pointer">{{CVR}}</a> <span class="glyphicon glyphicon-arrow-{{CVR_updown}}" title="{{CVR_updown === \'up\' ? \'相比前一天上升\' : CVR_updown === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></h1></div></div></div><div style="width: 49%;height: 200px;float: right;margin-right: 1%"><h3 style="padding-left: 20px">应用概况：</h3><div style="height:140px;margin-left: 20px;margin-right: 20px;border:1px solid #000000"><div ng-click="toApp()" style="width:30%;height:100px;margin-top: 20px;margin-left: 2.5%;float:left;border:1px solid #000000"><h5 style="text-align: center">系统应用APP数</h5><h1 style="text-align: center"><a style="text-decoration:none;cursor: pointer">{{appCount}}</a></h1></div><div ng-click="toApp()" style="width:30%;height:100px;margin-top: 20px;margin-left: 2.5%;float:left;border:1px solid #000000"><h5 style="text-align: center">最新SDK版本</h5><h1 style="text-align: center"><a style="text-decoration:none;cursor: pointer">{{sdkv}}</a></h1></div><div ng-click="toAppSyn()" style="width:30%;height:100px;margin-top: 20px;margin-left: 2.5%;float:left;border:1px solid #000000"><h5 style="text-align: center">未发布应用数</h5><h1 style="text-align: center"><a style="text-decoration:none;cursor: pointer">{{appSynCount}}</a></h1></div></div></div></div><div style="width: 100%;margin-top: 50px"><div id="chartContainer" style="width:90%; height:450px;margin:0 auto;"></div></div><div style="width: 100%;height: 300px;margin-top: 30px"><div style="width: 49%;height: 300px;float: left;margin-left: 1%;"><h4 style="padding-left: 20px">图片点击统计（昨日）：</h4><div class="panel-body"><table class="table table-hover table-bordered"><tr><td class="td_width120">图片名称</td><td>显示数</td><td>点击数</td><td>点击率</td></tr><tr ng-repeat="item in picStatisticsData | orderBy:col:desc"><td class="td_width120">{{item.pic_name}}</td><td>{{item.show_num}}</td><td>{{item.click_num}}</td><td>{{item.click_rate}}</td></tr></table></div></div><div style="width: 39%;height: 300px;float: right;margin-right: 1%;"><h4 style="padding-left: 20px">登录日志：</h4><div class="panel-body"><table class="table table-hover table-bordered"><tr><td class="td_width120">账户类型</td><td>账户名称</td><td>登陆时间</td></tr><tr ng-repeat="log in logs"><td class="td_width120">{{log.company_name}}</td><td>{{log.operator}}</td><td>{{log.time}}</td></tr></table></div></div></div></div>');

  $templateCache.put('gen-pagination.html', '<ul class="pagination small" ng-show="total>perPages[0]"><li ng-class="{disabled: !prev}"><a ng-href="{{path&&prev?path+prev:\'\'}}" title="上一页" ng-click="paginationTo(prev)">&laquo;</a></li><li class="cursor_p" ng-class="{active: n === pageNumber, disabled: n === \'…\' || n === \'...\'}" ng-repeat="n in showPages"><a ng-href="{{path&&n!=\'…\'&&n!=pageNumber?path+n:\'\'}}" title="{{n!=\'…\'?\'第\'+n+\'页\':\'\'}}" ng-click="paginationTo(n)">{{n}}</a></li><li ng-class="{disabled: !next}"><a ng-href="{{path&&next?path+next:\'\'}}" title="下一页" ng-click="paginationTo(next)">&#187;</a></li></ul>');

  $templateCache.put('geoCode.html', '<p class="clearfix"><input type="search" ng-model="query" placeholder="搜索" class="searchInput pull-right"></p><div class="panel panel-default"><div class="panel-heading"><div class="row"><div class="col-sm-4"><div class="col-sm-5">名称</div><div class="col-sm-3">编码</div><div class="col-sm-4">所属地区</div></div><div class="col-sm-4"><div class="col-sm-5">名称</div><div class="col-sm-3">编码</div><div class="col-sm-4">所属地区</div></div><div class="col-sm-4"><div class="col-sm-5">名称</div><div class="col-sm-3">编码</div><div class="col-sm-4">所属地区</div></div></div></div><div class="panel-body geo-info"><div class="col-sm-4 line_height item" ng-repeat="geo in geoInfos | filter : query"><div class="col-sm-5">{{geo.name}}</div><div class="col-sm-3">{{geo.code}}</div><div class="col-sm-4">{{geo.region}}</div></div></div></div>');

  $templateCache.put('geoextCode.html', '<div class="panel panel-default"><div class="panel-heading"><div class="row"><div class="col-sm-6"><div class="col-sm-2">名称</div><div class="col-sm-2">编码</div><div class="col-sm-8">包含国家</div></div><div class="col-sm-6"><div class="col-sm-2">名称</div><div class="col-sm-2">区域编码</div><div class="col-sm-8">包含国家</div></div></div></div><div class="panel-body"><div class="col-sm-6 line_height" ng-repeat="geoext in geoextInfos"><div class="col-sm-2" style="overflow:hidden;text-overflow: ellipsis;">{{geoext.name}}</div><div class="col-sm-2" style="overflow:hidden;text-overflow: ellipsis;">{{geoext.code}}</div><div class="col-sm-8 border_r" style="overflow:hidden;text-overflow: ellipsis;">{{geoext.geo}}</div></div></div></div>');

  $templateCache.put('index.html', '<div><div ui-view="topbar"></div><div ui-view="sidebar" class="lefter"></div><div ui-view="mainbody" class="righter"></div></div>');

  $templateCache.put('languageCode.html', '<p class="clearfix"><input type="search" ng-model="query" placeholder="搜索" class="searchInput pull-right"></p><div class="panel panel-default"><div class="panel-heading"><div class="row"><div class="col-sm-3"><div class="col-sm-6">名称</div><div class="col-sm-6">编码</div></div><div class="col-sm-3"><div class="col-sm-6">名称</div><div class="col-sm-6">编码</div></div><div class="col-sm-3"><div class="col-sm-6">名称</div><div class="col-sm-6">编码</div></div><div class="col-sm-3"><div class="col-sm-6">名称</div><div class="col-sm-6">编码</div></div></div></div><div class="panel-body lang-info"><div class="col-sm-3 line_height item" ng-repeat="language in languageInfos | filter : query"><div class="col-sm-6">{{language.name}}</div><div class="col-sm-6">{{language.code}}</div></div></div></div>');

  $templateCache.put('login.html', '<form class="form-signin" novalidate><div class="loginBg"><div class="siginInPosition"><div class="panel-body signInWrap loginWrap" ng-if="!$state.includes(\'login1\')"><p class="text-center text-info" style="margin-bottom:30px;"><b>欢迎登录 FB</b></p><div class="form-group text-center"><input class="form-control" type="email" placeholder="邮箱ID" ng-model="login.logname" ui-validate="{pattern:checkEmail}" gen-tooltip="validateTooltip" id="username"></div><div class="form-group text-center"><input class="form-control" type="password" placeholder="账户密码" id="password" name="login.logpwd" ng-model="login.logpwd" ng-minlength="6" ng-maxlength="20" gen-tooltip="validateTooltip" required></div><div class="row text-center"><div class="col-sm-offset-2 col-sm-8"><button class="btn btn-info form-control" type="submit" ng-click="loginSubmit()">登&nbsp;&nbsp;&nbsp;录</button></div></div><p class="text-center" style="font-size:12px;color:#666;margin-top:30px;">如果出现异常，可以清理一下缓存</p></div><div class="panel-body signInWrap registWrap" ng-if="$state.includes(\'login1\')"><p class="text-center text-info">欢迎注册</p><div class="form-group"><input class="form-control" type="email" placeholder="邮箱ID" name="loginId" ng-model="user.login_id" data-valid-name="邮箱" ui-validate="{pattern:checkEmail}" gen-tooltip="validateTooltip"></div><div class="form-group"><input class="form-control" type="password" placeholder="输入6-15位密码" data-valid-name="密码" ng-model="user.password" ng-minlength="6" ng-maxlength="20" gen-tooltip="validateTooltip" required></div><div class="form-group"><input class="form-control" type="password" placeholder="确认密码" data-valid-name="密码" ng-model="user.password2" ui-validate="{repasswd:\'$value==user.password\'}" ui-validate-watch="\'user.password\'" gen-tooltip="validateTooltip"></div><div class="form-group"><input class="form-control" type="text" placeholder="用户昵称" data-valid-name="联系人" ng-model="user.contacts" gen-tooltip="validateTooltip" required></div><div class="form-group"><input class="form-control" type="text" placeholder="团队名称" data-valid-name="团队名称" ng-model="user.company_name" gen-tooltip="validateTooltip" required></div><div class="form-group"><input class="form-control" type="text" placeholder="输入有效电话" data-valid-name="电话" ui-validate="{pattern:checkTel}" ng-model="user.telephone" gen-tooltip="validateTooltip"></div><div class="row" ng-if="opRegDisable"><div class="col-sm-offset-2 col-sm-8"><button class="btn btn-info form-control" type="submit" ng-click="registerSubmit()">注&nbsp;&nbsp;&nbsp;册</button></div></div></div></div></div></form>');

  $templateCache.put('logSyn.html', '<div class="panel panel-default"><div class="panel-heading"><p class="clearfix"><span class="pull-right"><span class="glyphicon glyphicon-calendar" style="font-size: 24px;color:#787878;position: relative;top:7px;"></span><input class="searchInput cursor_p" type="text" readonly name="reservation" id="reservation" placeholder="根据时间搜索"></span></p></div><div class="panel-body"><table class="table table-bordered table-hover"><tr class="tableTitle"><td class="td_width80">序列</td><td>发布原因</td><td>平台</td><td>发布状态</td><td class="td_width200">发布时间</td></tr><tr ng-repeat="log in logs"><td class="td_width80">{{$index + 1}}</td><td>{{log.reason}}</td><td ng-if="log.platform === \'1\'">android</td><td ng-if="log.platform === \'2\'">iOS</td><td>{{log.info}}</td><td class="td_width200">{{log.time}}</td></tr></table></div></div><nav class="text-right" gen-pagination="pagination"></nav><p class="nothing" ng-if="apps.length == 0">暂无数据信息</p>');

  $templateCache.put('mainbody.html', '<p class="form-group"><span ng-show="$state.includes(\'index\')">应用管理> <span ng-if="$state.includes(\'index.appInsert\')">新增应用</span> <span ng-if="$state.includes(\'index.showAppBascInfo\')">查看应用</span> <span ng-if="$state.includes(\'index.appBascInfo\')">管理应用</span> <span ng-if="$state.includes(\'index.appModify\')">编辑应用>{{rootAppName}}</span> <span ng-if="$state.includes(\'index.appKey\')">APPKEY</span> <span ng-if="$state.includes(\'index.appSyn\')">发布应用</span> <span ng-if="$state.includes(\'index.paramCtrl\')">控制参数>{{rootAppName}}</span> <span ng-if="$state.includes(\'index.paramInject\')">注入参数>{{rootAppName}}</span> <span ng-if="$state.includes(\'index.paramCustom\')">自定义参数>{{rootAppName}}</span> <span ng-if="$state.includes(\'index.appAdPolymer\')">聚合广告</span> <span ng-if="$state.includes(\'index.appAdPolymerInsert\')">新增聚合广告</span> <span ng-if="$state.includes(\'index.appAdPolymerModify\')">编辑聚合广告</span> <span ng-if="$state.includes(\'index.appLink\')">应用分组</span> <span ng-if="$state.includes(\'index.appAdStrategy\')">广告管理</span> <span ng-if="$state.includes(\'index.appTimingTask\')">广告管理>定时任务</span></span> <span ng-show="$state.includes(\'strategy\')">投放管理> <span ng-if="$state.includes(\'strategy.strategyInsert\')">新增策略</span> <span ng-if="$state.includes(\'strategy.strategyInfo\')">查看策略</span> <span ng-if="$state.includes(\'strategy.strategyModify\')">编辑策略</span></span> <span ng-show="$state.includes(\'task\')">任务管理> <span ng-if="$state.includes(\'task.taskInsert\')">新增任务组</span> <span ng-if="$state.includes(\'task.taskInfo\')">查看任务组</span> <span ng-if="$state.includes(\'task.taskModify\')">编辑任务组</span></span> <span ng-show="$state.includes(\'document\')">文档中心> <span ng-if="$state.includes(\'document.geoCode\')">地区代码</span> <span ng-if="$state.includes(\'document.geoextCode\')">区域代码</span> <span ng-if="$state.includes(\'document.marketInfo\')">市场信息</span> <span ng-if="$state.includes(\'document.language\')">语言代码</span> <span ng-if="$state.includes(\'document.syscode\')">系统编码</span> <span ng-if="$state.includes(\'document.testid\')">TESTID</span></span> <span ng-show="$state.includes(\'data\')">统计分析> <span ng-if="$state.includes(\'data.statistics\')">核心数据</span> <span ng-if="$state.includes(\'data.bannerStatistics\')">Banner</span> <span ng-if="$state.includes(\'data.nativeStatistics\')">Native</span> <span ng-if="$state.includes(\'data.iconStatistics\')">Icon</span> <span ng-if="$state.includes(\'data.pushStatistics\')">Push</span> <span ng-if="$state.includes(\'data.interstitialStatistics\')">Interstitial</span> <span ng-if="$state.includes(\'data.moreStatistics\')">More</span> <span ng-if="$state.includes(\'data.offerStatistics\')">Offer</span> <span ng-if="$state.includes(\'data.picStatistics\')">图片点击</span></span> <span ng-show="$state.includes(\'resource\')">资源管理> <span ng-if="$state.includes(\'resource.resourceList\')">查看资源</span> <span ng-if="$state.includes(\'resource.resourceUpload\')">上传资源</span></span> <span ng-show="$state.includes(\'log\')">操作日志> <span ng-if="$state.includes(\'log.logSyn\')">发布日志</span></span> <span ng-show="$state.includes(\'test\')">测试ID> <span ng-if="$state.includes(\'test.testApp\')">测试ID</span> <span ng-if="$state.includes(\'test.testAppPub\')">测试ID发布</span></span> <span ng-show="$state.includes(\'account\')">权限管理> <span ng-if="$state.includes(\'account.subAccount\')">子账户</span></span> <span ng-show="$state.includes(\'timingTask\')">定时任务> <span ng-if="$state.includes(\'timingTask.taskAdStrategyInfo\')">任务策略</span> <span ng-if="$state.includes(\'timingTask.taskAdStrategyInsert\')">新增策略</span></span></p><div ui-view></div>');

  $templateCache.put('marketInfo.html', '<div class="panel panel-default"><table class="table table-bordered" ng-if="markets.length !== 0"><tr class="tableTitle"><td>名称</td><td>包名</td><td>uri</td><td>webUrl</td></tr><tr ng-repeat="market in markets"><td>{{market.name}}</td><td>{{market.pkgname}}</td><td>{{market.uri}}</td><td>{{market.weburl}}</td></tr></table></div>');

  $templateCache.put('noticeInfo.html', '<div class="panel panel-default form-group"><div class="panel-body" ng-if="infos.length !== 0"><table class="table table-bordered table-hover"><tr class="tableTitle"><td>序号</td><td class="td_width200">创建时间</td><td>主题</td><td class="td_width200">操作</td></tr><tr ng-repeat="info in infos"><td>{{$index+1}}</td><td class="td_width200">{{info.ctime}}</td><td>{{info.title}}</td><td class="td_width200"><a href class="glyphicon glyphicon-eye-open" data-target="#noticeInfoModal" data-toggle="modal" ng-click="showNoticeInfo($index)">查看内容</a></td></tr></table></div></div><p class="nothing" ng-if="infos.length == 0">暂无数据信息</p><nav class="text-right" gen-pagination="pagination"></nav><div class="modal fade modalPosition" id="noticeInfoModal"><div class="modal-content modal-dialog"><div class="modal-header"><p><a class="close" data-dismiss="modal">×</a></p></div><div class="modal-body clearfix"><div class="form-group"><span class="modalSpan">主题：</span> <input class="modalInput" ng-model="showInfo.title" disabled></div><div class="form-group"><span class="modalSpan">内容：</span> <textarea ng-model="showInfo.content" class="paramTextarea" disabled></textarea></div></div></div></div>');

  $templateCache.put('paramCtrl.html', '<div class="panel panel-default"><div class="panel-heading"><p class="panel-title">参数设置</p></div><div class="panel-body"><div class="form-group" ng-repeat="param in params"><div class="row"><label class="col-sm-3 control-label text-right"><span class="cursor_p glyphicon glyphicon-question-sign" title="{{param.note}}"></span>&nbsp;{{param.key}}：</label><div class="col-sm-6"><input class="form-control" ng-model="param.value" disabled></div><div class="col-sm-1"><button class="btn btn-info form-control" data-target="#paramTmplBatch" data-toggle="modal" ng-click="showModel($index)">编辑</button></div></div></div></div></div><div class="modal fade" id="paramTmplBatch"><div class="modal-content modal-dialog"><div class="modal-header"><p><a class="close" data-dismiss="modal">×</a></p></div><div class="modal-body clearfix"><div class="clearfix" ng-class="{margin_b20:showParam.type===\'1\'}"><p>{{showParam.key}}：&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: red">注：请将权重weight设置在-1和10000之间！</span></p><div><textarea ng-if="showParam.type === \'1\'" ng-model="showParam.value" class="paramTextarea" style="width:100%;"></textarea><div ng-if="showParam.type !== \'1\'" ng-jsoneditor ng-model="showParam.value" options="options" class="height300"></div></div></div><div class="bg-danger clearfix panel-body" ng-if="errors.length != 0"><p style="text-indent: 10px;" class="text-danger" ng-repeat="error in errors">error : {{error.error}}</p></div><div class="form-group clearfix">将以上修改同时应用于：&nbsp;&nbsp; <input type="checkbox" class="cursor_p" ng-checked="selectAllFlag" ng-click="selectAll()">&nbsp;全选 <input type="search" ng-model="condition.query" placeholder="按app名称搜索" class="searchInput pull-right" ng-model-options="{debounce:{default:1000,blur:0}}"></div><div class="geoPanel"><div ng-repeat="group in groups" class="form-group"><p ng-if="group.apps.length !==0"><span class="badge">应用组:{{group.linkid}}</span></p><label class="btn btn-default mark-{{app.mark}}" ng-class="{selected: app.checked}" ng-repeat="app in group.apps" ng-click="addToMyApp(app)">{{app.name}}</label></div></div></div><div class="modal-footer"><button class="btn btn-info" ng-click="updateParamToOtherApp(showParam)">保&nbsp;&nbsp;存</button></div></div></div>');

  $templateCache.put('paramCustom.html', '<div class="panel panel-default"><div class="panel-heading"><p class="panel-title"><button class="btn btn-info" data-target="#paramTmplBatch" data-toggle="modal" ng-click="addParam()"><span class="glyphicon glyphicon-plus"></span>&nbsp;点击新增</button> <button class="btn btn-info" data-target="#copyParam" data-toggle="modal">批量复制</button></p></div><div class="panel-body"><div class="form-group" ng-repeat="param in myparams"><div class="row"><label class="col-sm-2 control-label text-right"><span class="cursor_p glyphicon glyphicon-question-sign" title="{{param.note}}"></span>&nbsp;{{param.key}}：</label><div class="col-sm-7"><input class="form-control" ng-model="param.value" disabled></div><div class="col-sm-1"><button class="btn btn-info form-control" data-target="#paramTmplBatch" data-toggle="modal" ng-click="showModel(param)">编辑</button></div><div class="col-sm-1"><button class="btn btn-info form-control" ng-click="delParam($index)">删除</button></div></div></div></div></div><div class="modal fade modalPosition" id="paramTmplBatch"><div class="modal-content modal-dialog"><div class="modal-header"><p><a class="close" ng-click="closeModel()" data-dismiss="modal">×</a></p></div><div class="modal-body clearfix"><div class="form-group" ng-if="isAddNewParam"><span class="modalSpan">参数名称：</span> <input class="modalInput" ng-model="showParam.key"></div><div class="form-group" ng-if="!isAddNewParam"><span class="modalSpan">参数名称：</span> <input class="modalInput" ng-model="showParam.key" disabled></div><div class="form-group"><span class="modalSpan">备注：</span> <input class="modalInput" ng-model="showParam.note"></div><div class="form-group"><span class="modalSpan">参数值：</span> <textarea class="paramTextarea" ng-model="showParam.value"></textarea></div><div class="form-group clearfix">将以上修改同时应用于&nbsp;&nbsp;<input type="checkbox" class="cursor_p" ng-checked="selectAllFlag" ng-click="selectAll()">&nbsp;全选 <input type="search" ng-model="condition.query" placeholder="按app名称搜索" class="searchInput pull-right" ng-model-options="{debounce:{default:1000,blur:0}}"></div><div class="geoPanel"><div ng-repeat="group in groups" class="form-group"><p ng-if="group.apps.length !== 0"><span class="badge">应用组</span>{{group.linkid}}</p><label class="btn btn-default mark-{{app.mark}}" ng-class="{selected: app.checked}" ng-repeat="app in group.apps" ng-click="addToMyApp(app)">{{app.name}}</label></div></div></div><div class="modal-footer"><button class="btn btn-info" data-dismiss="modal" ng-click="addParamToOtherApp(showParam)">保&nbsp;&nbsp;存</button></div></div></div><div class="modal fade modalPosition" id="copyParam"><div class="modal-dialog modal-content"><div class="modal-header"><p><a class="close" data-dismiss="modal">×</a></p></div><div class="modal-body clearfix"><div class="form-group clearfix"><label class="control-label col-sm-3">请选择参数来源：</label><div class="col-sm-9"><select class="form-control" ng-model="otherAppkey" ng-options="app.appkey as app.name for app in appkeys"><option value>--请选择app--</option></select></div></div><p class="text-center">复制此应用的所有在线参数</p></div><div class="modal-footer"><button class="btn btn-info" data-dismiss="modal" ng-click="addOtherParamToOwn()">保&nbsp;&nbsp;存</button></div></div></div>');

  $templateCache.put('paramInject.html', '<div class="panel panel-default"><div class="panel-body"><div class="row"><label class="col-sm-2 control-label text-right">&nbsp;&nbsp;参数名称</label> <label class="col-sm-4">开关项</label> <label class="col-sm-4">控制条件</label></div><div class="form-group" ng-repeat="param in myparams"><div class="row"><label class="col-sm-2 control-label text-right"><span class="cursor_p glyphicon glyphicon-question-sign" title="{{param.note}}"></span>&nbsp;{{param.name}}：</label><div class="col-sm-1"><input class="form-control" ng-model="param.switch" disabled></div><div class="col-sm-6" ng-if="param.open_condition !== undefined"><input class="form-control" ng-model="param.open_condition" disabled></div><div class="col-sm-6" ng-if="param.open_condition === undefined"><input class="form-control" placeholder="无控制条件" disabled></div><div class="col-sm-1"><button class="btn btn-info form-control" data-target="#paramTmplBatch" data-toggle="modal" ng-click="showModel(param)">编辑</button></div></div></div></div></div><div class="modal fade modalPosition" id="paramTmplBatch"><div class="modal-content modal-dialog"><div class="modal-header"><p><a class="close" data-dismiss="modal">×</a></p></div><div class="modal-body clearfix"><div class="form-group" ng-if="isAddNewParam"><span class="modalSpan">参数名称：</span> <input class="modalInput" ng-model="showParam.name"></div><div class="form-group" ng-if="!isAddNewParam"><span class="modalSpan">参数名称：</span> <input class="modalInput" ng-model="showParam.name" disabled></div><div class="form-group"><span class="modalSpan">开关状态：</span> <input class="modalInput" ng-model="showParam.switch"></div><div class="form-group" ng-if="!isAddNewParam && showParam.open_condition !== undefined"><span class="modalSpan">控制条件：</span> <textarea cols="4" class="paramTextarea" ng-model="showParam.open_condition"></textarea></div><div class="bg-danger clearfix panel-body" ng-if="errors.length != 0"><p style="text-indent: 10px;" class="text-danger" ng-repeat="error in errors">error : {{error.error}}</p></div><div class="form-group clearfix">将以上修改同时应用于：&nbsp;&nbsp; <input type="checkbox" class="cursor_p" ng-checked="selectAllFlag" ng-click="selectAll()">&nbsp;全选 <input type="search" ng-model="condition.query" placeholder="按app名称搜索" class="searchInput pull-right" ng-model-options="{debounce:{default:1000,blur:0}}"></div><div class="geoPanel"><div ng-repeat="group in groups" class="form-group"><p ng-if="group.apps.length !==0"><span class="badge">应用组</span>{{group.linkid}}</p><label class="btn btn-default mark-{{app.mark}}" ng-class="{selected: app.checked}" ng-repeat="app in group.apps" ng-click="addToMyApp(app)">{{app.name}}</label></div></div></div><div class="modal-footer"><button class="btn btn-info" ng-click="updateInjectedParamToApp(showParam)">保&nbsp;&nbsp;存</button></div></div></div>');

  $templateCache.put('resourceList.html', '<div class="panel panel-default form-group"><div class="panel-heading"><p class="panel-title"><input type="search" ng-model="search.name" placeholder="按资源名称搜索" class="searchInput" ng-model-options="{debounce:{default:1000,blur:0}}"></p></div><div class="panel-body" ng-if="list.length !==0"><table class="table table-bordered table-hover"><tr class="tableTitle text-center"><td>资源类型</td><td class="text-left">资源名称</td><td>分辨率</td><td>语种</td><td>上传时间</td><td>操作</td></tr><tr ng-repeat="res in list | filter:search" class="text-center"><td ng-if="res.type === \'l\'">横图</td><td ng-if="res.type === \'o\'">自定义</td><td ng-if="res.type === \'p\'">竖图</td><td ng-if="res.type === \'s\'">方图</td><td ng-if="res.type === \'ic\'">icon</td><td class="cursor_p text-left" style="position: relative;">{{res.name}}</td><td>{{res.resolution}}</td><td>{{res.language}}</td><td>{{res.ctime}}</td><td><a href data-target="#paramTmplBatch" data-toggle="modal" ng-click="showImg(res.img)">查看图片</a>&nbsp;&nbsp; <a ng-click="selectTransferApp(res.name)" data-toggle="modal" data-target="#userselector" class="cursor_p">迁移&nbsp;&nbsp;</a> <a data-toggle="modal" class="cursor_p" ng-click="delImg(res.name,$index)">删除</a></td></tr></table></div></div><div class="modal fade modalPosition" id="paramTmplBatch"><div class="modal-dialog" style="width:300px;"><a class="close" ng-click="closeModel()" data-dismiss="modal" style="position:absolute;top:-15px;right:-15px;"><span class="glyphicon glyphicon-remove" style="font-color:#fff;"></span></a> <img ng-src="{{myImg}}" style="width:100%;"></div></div><nav class="text-right" gen-pagination="pagination"></nav><p class="nothing" ng-if="list.length == 0">暂无资源信息</p><div class="modal fade" id="userselector"><div class="modal-content modal-dialog"><div class="modal-header"><p><a class="close" data-dismiss="modal">×</a></p><p>被迁移的应用:{{imgName}}</p></div><div class="form-group clearfix"><label class="control-label col-md-3 text-right">输入目标账号：</label><div class="col-md-8"><input class="form-control" ng-model="login_id"></div></div><div class="form-group clearfix"><label class="control-label col-md-3 text-right">当前账户密码：</label><div class="col-md-8"><input class="form-control" ng-model="selfPassword"></div></div><div class="modal-footer"><button class="btn btn-info" ng-click="transferUserRes()">确&nbsp;&nbsp;定</button></div></div></div>');

  $templateCache.put('resourceUpload.html', '<div class="panel panel-default"><div class="panel-heading"><p class="panel-title">上传资源面板</p></div><div class="panel-body clearfix"><div class="form-group clearfix"><div class="col-sm-offset-2 res-type-container"><select class="form-control cursor_p" ng-model="res.type" required><option value>--资源类型--</option><option value="l">横图</option><option value="p">竖图</option><option value="s">方图</option><option value="ic">icon</option><option value="o">其他</option></select></div><div class="res-resolution-container" ng-if="res.type !== \'ic\' && res.type !== \'o\'"><select class="form-control cursor_p" required ng-model="res.resolution"><option value>--资源分辨率--</option><option>480x854</option><option>720x1280</option><option>1024x500</option><option>480x480</option><option>720x720</option><option>1200x628</option></select></div><div style="float: left;" ng-if="res.type === \'o\'"><span>自定义分辨率:</span> <input style="width: 200px" class="modalInput" ng-model="res.resolution" placeholder="例如:96x96(中间是字母x)"></div><div class="lang-container" ng-if="res.type !== \'ic\'"><select class="form-control" ng-model="res.language" required ng-options="lang.code as lang.name for lang in languageInfos"><option value>默认语言</option></select></div></div><div class="form-group clearfix"><div class="col-sm-5 col-sm-push-2 clearfix"><div class="form-group"><img ngf-src="showImage" class="imgDropWrap" ngf-select ngf-drop ng-model="iconImg"></div><p class="text-danger">图片命名规则：(非icon)appname_en_p_480x854_1.png (icon)appname_ic_1.png icon的规格:96x96</p><p class="text-danger">(应用名_语言_类型_分辨率_序号 注：应用名不能有空格和下划线，如有请去掉！l代表横图 p代表竖图 s方图 o代表其他类型 ic代表icon)</p><p class="text-danger">icon的大小请不要超过10K,其他类型的请不要超过180K,请上传jpg,png格式图片</p></div></div><div class="clearfix"><div class="col-sm-2 col-sm-push-2"><button class="btn btn-info" ng-click="upload()">提&nbsp;&nbsp;交</button></div></div></div></div><div class="bg-danger clearfix panel-body" ng-if="errors.length != 0"><p style="text-indent: 10px;" class="text-danger" ng-repeat="error in errors">error : {{error.error}}</p></div>');

  $templateCache.put('sadminAdStrategyInfo.html', '<div class="panel panel-default form-group"><div class="panel-heading"><span class="panel-title">广告策略列表</span> <input type="search" placeholder="按策略名称搜索" ng-model="condition.query" class="searchInput" ng-model-options="{debounce:{default:1000,blur:0}}"></div><div class="panel-body"><table class="table table-hover table-bordered"><tr class="tableTitle"><td class="text-center">策略名称</td><td class="td_width120">策略级别</td><td class="text-center">操作</td></tr><tr ng-repeat="adStrategy in adStrategys"><td class="text-center">{{adStrategy.name}}</td><td class="td_width120">{{adStrategy.default}}</td><td class="text-center"><a href data-toggle="modal" ng-click="showUpdateModal(adStrategy, \'all\')" data-target="#showUpdateModal" style="width:80px;">编&nbsp;辑</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <a href data-toggle="modal" ng-click="copyStrategyModal(adStrategy)" data-target="#copyStrategyModal" style="width:80px;">复&nbsp;制</a>&nbsp;&nbsp;&nbsp; <a href data-toggle="modal" ng-click="showUpdateModal(adStrategy, \'native\')" data-target="#adStrategyNodeModel">native</a>&nbsp;&nbsp;&nbsp; <a href data-toggle="modal" ng-click="showUpdateModal(adStrategy, \'interstitial\')" data-target="#adStrategyNodeModel">interstitial</a>&nbsp;&nbsp;&nbsp; <a href data-toggle="modal" ng-click="showUpdateModal(adStrategy, \'banner\')" data-target="#adStrategyNodeModel">banner</a>&nbsp;&nbsp;&nbsp; <a href data-toggle="modal" ng-click="showUpdateModal(adStrategy, \'video\')" data-target="#adStrategyNodeModel">video</a>&nbsp;&nbsp;&nbsp; <a href data-toggle="modal" ng-click="showUpdateModal(adStrategy, \'idext\')" data-target="#adStrategyNodeModel">idext</a></td></tr></table></div></div><nav class="text-right" gen-pagination="pagination"></nav><p class="nothing" ng-if="adStrategys.length == 0">暂无数据信息</p><div class="modal fade height100" id="showUpdateModal"><div class="modal-content height100"><div class="modal-header"><p><a class="close" data-dismiss="modal">×</a></p></div><div class="modal-body height100"><p>广告策略名称:&nbsp;<input type="text" class="searchInput" ng-model="newName"></p><div ng-jsoneditor ng-model="mystrategy.value" ng-if="default === \'0\'" options="options" style="height: 50%;"></div><div ng-jsoneditor ng-model="mystrategy.value" ng-if="default === \'1\'" options="options" style="height: 85%!important;"></div><div style="margin-top:20px;" ng-if="default === \'0\'"><p>已添加的用户:</p><div class="form-group overflow_y" ng-class="{wraps:myusers.length !== 0}"><label ng-repeat="user in myusers" class="btn btn-default label142" ng-click="delUser($index)">{{user.showName}}</label></div><p>未添加的用户:</p><div class="form-group overflow_y" ng-class="{wraps:users.length !== 0}"><label ng-repeat="user in users" class="btn btn-default label142" ng-click="addUser($index)">{{user.showName}}</label></div></div></div><button class="btn btn-info returnJson" ng-click="updateAdStrategy()">保&nbsp;&nbsp;存</button></div></div><div class="modal fade" id="copyStrategyModal"><div class="modal-content modal-dialog"><div class="modal-header"><p><a class="close" data-dismiss="modal">×</a></p></div><div class="modal-body"><div class="clearfix"><span>策略名称：</span> <input ng-model="copystrategy.name" class="searchInput" style="width:480px;"></div></div><div class="modal-footer"><button class="btn btn-info" ng-click="copyAdStrategy()">确&nbsp;&nbsp;定</button></div></div></div><div class="modal fade" id="adStrategyNodeModel"><div class="modal-content modal-dialog"><div class="modal-header"><p><a class="close" data-dismiss="modal">×</a></p></div><div class="modal-body clearfix"><div class="clearfix"><p ng-if="adStrategyNodeType === \'native\'">{{newName}}>{{adStrategyNodeType}}</p><div><div ng-if="adStrategyNodeType === \'native\'" ng-jsoneditor ng-model="mystrategy.value.native" options="options" class="height300"></div><div ng-if="adStrategyNodeType === \'interstitial\'" ng-jsoneditor ng-model="mystrategy.value.interstitial" options="options" class="height300"></div><div ng-if="adStrategyNodeType === \'banner\'" ng-jsoneditor ng-model="mystrategy.value.banner" options="options" class="height300"></div><div ng-if="adStrategyNodeType === \'video\'" ng-jsoneditor ng-model="mystrategy.value.video" options="options" class="height300"></div><div ng-if="adStrategyNodeType === \'idext\'" ng-jsoneditor ng-model="mystrategy.value.idext" options="options" class="height300"></div></div></div></div><div class="modal-footer"><button class="btn btn-info" ng-click="updateAdStrategy()">保&nbsp;&nbsp;存</button></div></div></div>');

  $templateCache.put('sadminAdStrategyInsert.html', '<div ng-jsoneditor ng-model="data" options="options" class="jsontxt"></div><div class="form-group" style="position: relative"><ng-file-input mode="text" callback="callback(file)" class="ng-file-input"></ng-file-input><button class="btn btn-info btn-s" style="position: absolute; top: -4px;" ng-click="submit()">保&nbsp;&nbsp;存</button> <button class="btn btn-info btn-s" style="position: absolute; top: -4px; left: 220px;" data-toggle="modal" data-target="#fullpage">全&nbsp;&nbsp;屏</button></div><div class="modal fade height100" id="fullpage"><div class="modal-content height100"><div class="modal-body height100"><div ng-jsoneditor ng-model="data" options="options" class="jsontxt height100"></div></div><button class="btn btn-info returnJson" data-dismiss="modal">返&nbsp;&nbsp;回</button></div></div><div class="bg-danger clearfix panel-body" ng-if="errors.length != 0"><p style="text-indent: 10px;" class="text-danger" ng-repeat="error in errors">error : {{error.error}}</p></div><div><p>已添加的用户:</p><div class="form-group overflow_y" ng-class="{wraps:myusers.length !== 0}"><label ng-repeat="user in myusers" class="btn btn-default label142" ng-click="delUser($index)" title="{{user.showName}}">{{user.showName}}</label></div><p>未添加的用户:</p><div class="form-group overflow_y" ng-class="{wraps:users.length !== 0}"><label ng-repeat="user in users" class="btn btn-default label142" ng-click="addUser($index)">{{user.showName}}</label></div></div>');

  $templateCache.put('sadminAppTag.html', '<div class="panel panel-default"><div class="panel-heading cursor_p clearfix"><span class="panel-title"><button class="btn btn-default" data-toggle="modal" ng-click="showAddAppTagModal()" data-target="#appTagModal"><span class="glyphicon glyphicon-plus"></span>&nbsp;新增应用标签</button></span> <input type="search" ng-model="condition.category" placeholder="分类" class="searchInput" ng-model-options="{debounce:{default:1000,blur:0}}"> <input type="search" ng-model="condition.name" placeholder="应用名" class="searchInput" ng-model-options="{debounce:{default:1000,blur:0}}"> <input type="search" ng-model="condition.pkgName" placeholder="应用包名" class="searchInput" ng-model-options="{debounce:{default:1000,blur:0}}"></div><div class="panel-body"><table class="table table-bordered table-hover"><tr class="tableTitle"><td class="td_width180">应用名</td><td class="td_width180">应用包名</td><td>性别</td><td>age</td><td>分类</td><td>标签</td><td class="td_width180">操作</td></tr><tr ng-repeat="appTag in appTags" ng-if="appTags.length !== 0"><td class="td_width180">{{appTag.name}}</td><td class="td_width180">{{appTag.pkgName}}</td><td>{{appTag.sex}}</td><td>{{appTag.age}}</td><td>{{appTag.category}}</td><td>{{appTag.tags}}</td><td class="td_width180"><a class="glyphicon glyphicon-edit cursor_p" ng-click="showUpdateAppTagModal(appTag)" data-toggle="modal" data-target="#appTagModal">编辑</a>&nbsp; <a class="glyphicon glyphicon-edit cursor_p" ng-click="showCopyAppTagModal(appTag)" data-toggle="modal" data-target="#copyAppTagModal">导出</a>&nbsp; <a class="glyphicon glyphicon-eye-open cursor_p" ng-click="viewAppInfo(appTag.url)">查看</a> <a class="glyphicon glyphicon-remove cursor_p" ng-click="delAppTag($index)">删除</a></td></tr></table></div></div><p class="nothing" ng-if="appTags.length == 0">暂无数据信息</p><nav class="text-right" gen-pagination="pagination"></nav><div class="modal fade height100" id="appTagModal"><div class="modal-content height100"><div class="modal-header"><p><a class="close" data-dismiss="modal">×</a></p></div><div class="modal-body height100"><div ng-jsoneditor ng-model="newAppTag" options="options" style="height: 85%;"></div><div style="height: 10%;"><ng-file-input ng-if="isAddAppTag" mode="text" callback="callback(file)" class="ng-file-input">上传json文件</ng-file-input><button class="btn btn-info" ng-if="isAddAppTag" ng-click="addAppTag()">确&nbsp;&nbsp;定</button> <button class="btn btn-info" ng-if="!isAddAppTag" ng-click="updateAppTag()">更&nbsp;&nbsp;新</button><div class="bg-danger clearfix panel-body" ng-if="errors.length != 0"><p style="text-indent: 10px;" class="text-danger" ng-repeat="error in errors">error : {{error.error}}</p></div></div></div></div></div><div class="modal fade" id="copyAppTagModal"><div class="modal-content modal-dialog"><div class="modal-header"><p><a class="close" data-dismiss="modal">×</a></p></div><div class="modal-body clearfix"><div class="form-group clearfix"><label class="col-sm-2 control-label text-right">平台：</label><div class="col-sm-6"><select type="text" class="form-control" placeholder="选择平台" ng-model="newAppTag.platform"><option ng-if="platform !== \'1\'" value="1">android</option><option ng-if="platform !== \'2\'" value="2">iOS</option><option ng-if="platform !== \'3\'" value="3">WinPhone</option></select></div></div></div><div class="modal-footer"><button class="btn btn-info" ng-click="copyAppTag()">确&nbsp;&nbsp;定</button></div></div></div>');

  $templateCache.put('sadminGeoext.html', '<div class="panel panel-default"><div class="panel-heading"><p class="panel-title"><button class="btn btn-default" ng-click="showAddModel()" data-toggle="modal" data-target="#addGeoextPanel"><span class="glyphicon glyphicon-plus"></span>&nbsp;新增区域</button></p></div><table class="table table-bordered" ng-if="geoextInfos.length !== 0"><tr class="tableTitle"><td>区域名称</td><td>区域编码</td><td>区域所有国家</td><td>操作</td></tr><tr ng-repeat="region in geoextInfos"><td>{{region.name}}</td><td>{{region.code}}</td><td>{{region.chinesegeo}}</td><td style="width:180px;"><a class="glyphicon glyphicon-edit cursor_p" ng-click="showUpdateModel(region)" data-toggle="modal" data-target="#updateGeoextPanel">编辑</a>&nbsp;&nbsp; <a class="glyphicon glyphicon-remove cursor_p" ng-click="delRegion($index)">删除</a></td></tr></table></div><div class="modal" id="updateGeoextPanel"><div class="modal-content modal-dialog"><div class="modal-header"><p><a class="close" data-dismiss="modal">×</a></p></div><div class="modal-body clearfix"><div class="form-group"><span class>区域名称：</span> <input class="geoInput" ng-model="oldRegion.name" disabled> <span>区域代码：</span> <input class="geoInput" ng-model="oldRegion.code" disabled></div><p>勾选国家：</p><div class="geoPanel"><label class="btn btn-default geoLabel" ng-class="{bgSelected:region.checked}" ng-repeat="region in geoInfos" ng-click="addRegionToOwn(region)" title="{{region.name}}">{{region.name}}</label></div></div><div class="modal-footer"><button class="btn btn-info" data-dismiss="modal" ng-click="updateRegion()">保&nbsp;&nbsp;存</button></div></div></div><div class="modal" id="addGeoextPanel"><div class="modal-content modal-dialog"><div class="modal-header"><p><a class="close" data-dismiss="modal">×</a></p></div><div class="modal-body clearfix"><div class="form-group"><span>区域名称：</span> <input class="geoInput" ng-model="newRegion.name"> <span>区域代码：</span> <input class="geoInput" ng-model="newRegion.code"></div><p>勾选国家：</p><div class="geoPanel"><label class="btn btn-default geoLabel" ng-class="{bgSelected:region.checked}" ng-click="addRegionToOwn(region)" ng-repeat="region in geoInfos" title="{{region.name}}">{{region.name}}</label></div></div><div class="modal-footer"><button class="btn btn-info" data-dismiss="modal" ng-click="addRegion()">保&nbsp;&nbsp;存</button></div></div></div>');

  $templateCache.put('sadminHeader.html', '<nav class="header form-group" role="navigation"><span><span ng-if="!isSubAccount">[主账户]-超管-{{user.contacts}}</span>&nbsp;&nbsp; <span ng-if="isSubAccount">[子账户]-超管-{{user.contacts}}</span>&nbsp;&nbsp; <a ui-sref="userseting">用户设置</a>&nbsp;&nbsp; <a href ng-click="logout()">退出</a>&nbsp;&nbsp;</span><select class="cursor_p" ng-model="platform"><option value="2">iOS</option><option value="1">Android</option><option disabled>windowsPhone</option></select></nav>');

  $templateCache.put('sadminIndex.html', '<div><div ui-view="header"></div><div ui-view="lefter" class="lefter"></div><div ui-view="righter" class="righter"></div></div>');

  $templateCache.put('sadminLefter.html', '<div class="panel-group sidebar col-sm-12" id="accordion" role="sidebar"><div class="panel panel-default" ng-if="!isSubAccount || jurisdiction.para_ctrl ||jurisdiction.para_inject"><div class="panel-heading" data-toggle="collapse" data-parent="#accordion" data-target="#sadminParam"><p class="panel-title"><span class="glyphicon glyphicon-align-center"></span>&nbsp;&nbsp;参数管理</p></div><div class="secondMenu collapse" ng-class="{in:$state.includes(\'sadminParam\')}" id="sadminParam"><div class="panel-body"><p ui-sref="sadminParam.sadminParamCtrlInfo" ng-if="!isSubAccount || jurisdiction.para_ctrl" ng-class="{sidebarBcg : $state.includes(\'sadminParam.sadminParamCtrlInfo\')}"><span class="glyphicon glyphicon-random"></span>&nbsp;&nbsp;控制参数</p><p ui-sref="sadminParam.sadminParamInjectInfo" ng-if="!isSubAccount || jurisdiction.para_inject" ng-class="{sidebarBcg : $state.includes(\'sadminParam.sadminParamInjectInfo\')}"><span class="glyphicon glyphicon-random"></span>&nbsp;&nbsp;注入参数</p></div></div></div><div class="panel panel-default" ng-if="!isSubAccount || jurisdiction.view_strategy ||jurisdiction.new_strategy"><div class="panel-heading" data-toggle="collapse" data-parent="#accordion" data-target="#sadminStrategy"><p class="panel-title"><span class="glyphicon glyphicon-align-center"></span>&nbsp;&nbsp;投放管理</p></div><div class="secondMenu collapse" id="sadminStrategy" ng-class="{in:$state.includes(\'sadminStrategy\')}"><div class="panel-body"><p ui-sref="sadminStrategy.sadminStrategyInfo" ng-if="!isSubAccount || jurisdiction.view_strategy" ng-class="{sidebarBcg:$state.includes(\'sadminStrategy.sadminStrategyInfo\')}"><span class="glyphicon glyphicon-eye-open"></span>&nbsp;&nbsp;查看策略</p><p ui-sref="sadminStrategy.sadminStrategyInsert" ng-if="!isSubAccount || jurisdiction.new_strategy" ng-class="{sidebarBcg : $state.includes(\'sadminStrategy.sadminStrategyInsert\')}"><span class="glyphicon glyphicon-plus"></span>&nbsp;&nbsp;新增策略</p></div></div></div><div class="panel panel-default" ng-if="!isSubAccount || jurisdiction.view_task || jurisdiction.new_task"><div class="panel-heading" data-toggle="collapse" data-parent="#accordion" data-target="#sadminTask"><p class="panel-title"><span class="glyphicon glyphicon-align-center"></span>&nbsp;&nbsp;任务管理</p></div><div class="secondMenu collapse" id="sadminTask" ng-class="{in:$state.includes(\'sadminTask\')}"><div class="panel-body"><p ui-sref="sadminTask.sadminTaskInfo" ng-if="!isSubAccount || jurisdiction.view_task" ng-class="{sidebarBcg:$state.includes(\'sadminTask.sadminTaskInfo\')}"><span class="glyphicon glyphicon-eye-open"></span>&nbsp;&nbsp;查看任务组</p><p ui-sref="sadminTask.sadminTaskInsert" ng-if="!isSubAccount || jurisdiction.new_task" ng-class="{sidebarBcg : $state.includes(\'sadminTask.sadminTaskInsert\')}"><span class="glyphicon glyphicon-plus"></span>&nbsp;&nbsp;新增任务组</p></div></div></div><div class="panel panel-default" ng-if="!isSubAccount || jurisdiction.view_adstrategy || jurisdiction.new_adstrategy"><div class="panel-heading" data-toggle="collapse" data-target="#sadminCompagin" data-parent="#accordion"><p class="panel-title"><span class="glyphicon glyphicon-align-center"></span>&nbsp;&nbsp;广告策略</p></div><div class="secondMenu collapse" id="sadminCompagin" ng-class="{in:$state.includes(\'sadminAdStrategy\')}"><div class="panel-body"><p ui-sref="sadminAdStrategy.sadminAdStrategyInfo" ng-if="!isSubAccount || jurisdiction.view_adstrategy" ng-class="{sidebarBcg:$state.includes(\'sadminAdStrategy.sadminAdStrategyInfo\')}"><span class="glyphicon glyphicon-eye-open"></span>&nbsp;&nbsp;查看策略</p><p ui-sref="sadminAdStrategy.sadminAdStrategyInsert" ng-if="!isSubAccount || jurisdiction.new_adstrategy" ng-class="{sidebarBcg : $state.includes(\'sadminAdStrategy.sadminAdStrategyInsert\')}"><span class="glyphicon glyphicon-plus"></span>&nbsp;&nbsp;新增策略</p></div></div></div><div class="panel panel-default" ng-if="!isSubAccount || jurisdiction.app_ctrl"><div class="panel-heading" ui-sref="sadmin.saminMarketInfo" ng-class="{sidebarBcg:$state.includes(\'sadmin.saminMarketInfo\')}"><p class="panel-title"><span class="glyphicon glyphicon-asterisk"></span>&nbsp;&nbsp;应用管理</p></div></div><div class="panel panel-default" ng-if="!isSubAccount || jurisdiction.user_ctrl"><div class="panel-heading" data-parent="#accordion" data-toggle="collapse" data-target="#sadminUsersInfo"><p class="panel-title"><span class="glyphicon glyphicon-align-center"></span>&nbsp;&nbsp;用户管理</p></div><div class="secondMenu collapse" id="sadminUsersInfo" ng-class="{in:$state.includes(\'sadminUsers\')}"><div class="panel-body lefterNavItem"><p ui-sref="sadminUsers.sadminUsersInfo" ng-class="{sidebarBcg:$state.includes(\'sadminUsers.sadminUsersInfo\')}"><span class="glyphicon glyphicon-user"></span>&nbsp;&nbsp;用户信息</p></div></div></div><div class="panel panel-default" ng-if="!isSubAccount || jurisdiction.view_resource ||jurisdiction.upload_resource"><div class="panel-heading" data-toggle="collapse" data-parent="#accordion" data-target="#resource"><p class="panel-title"><span class="glyphicon glyphicon-bishop"></span>&nbsp;&nbsp;资源管理</p></div><div class="secondMenu collapse" ng-class="{in:$state.includes(\'sadminResource\')}" id="resource"><div class="panel-body"><p ui-sref="sadminResource.resourceList" ng-if="!isSubAccount || jurisdiction.view_resource" ng-class="{sidebarBcg : $state.includes(\'sadminResource.resourceList\')}"><span class="glyphicon glyphicon-eye-open"></span>&nbsp;&nbsp;查看资源</p><p ui-sref="sadminResource.resourceUpload" ng-if="!isSubAccount || jurisdiction.upload_resource" ng-class="{sidebarBcg : $state.includes(\'sadminResource.resourceUpload\')}"><span class="glyphicon glyphicon-upload"></span>&nbsp;&nbsp;上传资源</p></div></div></div><div class="panel panel-default" ng-if="!isSubAccount || jurisdiction.statistics_ctrl"><div class="panel-heading" data-parent="#accordion" data-toggle="collapse" data-target="#sadminStatisticsInfo"><p class="panel-title"><span class="glyphicon glyphicon-align-center"></span>&nbsp;&nbsp;统计分析</p></div><div class="secondMenu collapse" id="sadminStatisticsInfo" ng-class="{in:$state.includes(\'sadminStatistics\')}"><div class="panel-body lefterNavItem"><p ui-sref="sadminStatistics.basicStatisticsInfo" ng-class="{sidebarBcg:$state.includes(\'sadminStatistics.basicStatisticsInfo\')}"><span class="glyphicon glyphicon-stats"></span>&nbsp;&nbsp;概况</p><p ui-sref="sadminStatistics.statisticsInfo({adtype:\'0\'})" ng-class="{sidebarBcg:$state.includes(\'sadminStatistics.statisticsInfo\')}"><span class="glyphicon glyphicon-stats"></span>&nbsp;&nbsp;整体趋势</p><p ui-sref="sadminStatistics.bannerStatistics({adtype:\'banner\'})" ng-class="{sidebarBcg:$state.includes(\'sadminStatistics.bannerStatistics\')}"><span class="glyphicon glyphicon-stats"></span>&nbsp;&nbsp;banner</p><p ui-sref="sadminStatistics.nativeStatistics({adtype:\'native\'})" ng-class="{sidebarBcg:$state.includes(\'sadminStatistics.nativeStatistics\')}"><span class="glyphicon glyphicon-stats"></span>&nbsp;&nbsp;native</p><p ui-sref="sadminStatistics.iconStatistics({adtype:\'icon\'})" ng-class="{sidebarBcg:$state.includes(\'sadminStatistics.iconStatistics\')}"><span class="glyphicon glyphicon-stats"></span>&nbsp;&nbsp;icon</p><p ui-sref="sadminStatistics.pushStatistics({adtype:\'push\'})" ng-class="{sidebarBcg:$state.includes(\'sadminStatistics.pushStatistics\')}"><span class="glyphicon glyphicon-stats"></span>&nbsp;&nbsp;push</p><p ui-sref="sadminStatistics.interstitialStatistics({adtype:\'interstitial\'})" ng-class="{sidebarBcg:$state.includes(\'sadminStatistics.interstitialStatistics\')}"><span class="glyphicon glyphicon-stats"></span>&nbsp;&nbsp;interstitial</p><p ui-sref="sadminStatistics.moreStatistics({adtype:\'more\'})" ng-class="{sidebarBcg:$state.includes(\'sadminStatistics.moreStatistics\')}"><span class="glyphicon glyphicon-stats"></span>&nbsp;&nbsp;more</p><p ui-sref="sadminStatistics.offerStatistics({adtype:\'offer\'})" ng-class="{sidebarBcg:$state.includes(\'sadminStatistics.offerStatistics\')}"><span class="glyphicon glyphicon-stats"></span>&nbsp;&nbsp;offer</p><p ui-sref="sadminStatistics.picStatistics({adtype: \'pic\'})" ng-class="{sidebarBcg : $state.includes(\'sadminStatistics.picStatistics\')}"><span class="glyphicon glyphicon-record"></span>&nbsp;&nbsp;图片点击</p></div></div></div><div class="panel panel-default" ng-if="!isSubAccount || jurisdiction.area_ctrl"><div class="panel-heading" ui-sref="sadmin.sadminGeoext" ng-class="{sidebarBcg:$state.includes(\'sadmin.sadminGeoext\')}"><p class="panel-title"><span class="glyphicon glyphicon-asterisk"></span>&nbsp;&nbsp;区域管理</p></div></div><div class="panel panel-default" ng-if="!isSubAccount || jurisdiction.publish_application"><div class="panel-heading" ui-sref="sadmin.sadminSyn" ng-class="{sidebarBcg:$state.includes(\'sadmin.sadminSyn\')}"><p class="panel-title"><span class="glyphicon glyphicon-asterisk"></span>&nbsp;&nbsp;发布应用</p></div></div><div class="panel panel-default"><div class="panel-heading" data-parent="#accordion" data-toggle="collapse" data-target="#sadminLog"><p class="panel-title"><span class="glyphicon glyphicon-align-center"></span>&nbsp;&nbsp;操作日志</p></div><div class="secondMenu collapse" id="sadminLog" ng-class="{in:$state.includes(\'sadminLog\')}"><div class="panel-body lefterNavItem"><p ui-sref="sadminLog.sadminLogSyn" ng-class="{sidebarBcg:$state.includes(\'sadminLog.sadminLogSyn\')}"><span class="glyphicon glyphicon-record"></span>&nbsp;&nbsp;发布日志</p><p ui-sref="sadminLog.sadminLogApp" ng-class="{sidebarBcg:$state.includes(\'sadminLog.sadminLogApp\')}"><span class="glyphicon glyphicon-record"></span>&nbsp;&nbsp;应用日志</p><p ui-sref="sadminLog.sadminLogOpt" ng-class="{sidebarBcg:$state.includes(\'sadminLog.sadminLogOpt\')}"><span class="glyphicon glyphicon-record"></span>&nbsp;&nbsp;投放日志</p><p ui-sref="sadminLog.sadminLogLoginIn" ng-class="{sidebarBcg:$state.includes(\'sadminLog.sadminLogLoginIn\')}"><span class="glyphicon glyphicon-record"></span>&nbsp;&nbsp;登录日志</p><p ui-sref="sadminLog.sadminLogAd" ng-class="{sidebarBcg:$state.includes(\'sadminLog.sadminLogAd\')}"><span class="glyphicon glyphicon-record"></span>&nbsp;&nbsp;策略日志</p></div></div></div><div class="panel panel-default"><div class="panel-heading" data-parent="#accordion" data-toggle="collapse" data-target="#sadminNotice"><p class="panel-title"><span class="glyphicon glyphicon-align-center"></span>&nbsp;&nbsp;系统消息</p></div><div class="secondMenu collapse" id="sadminNotice" ng-class="{in:$state.includes(\'sadminNotice\')}"><div class="panel-body lefterNavItem"><p ui-sref="sadminNotice.info" ng-class="{sidebarBcg:$state.includes(\'sadminNotice.info\')}"><span class="glyphicon glyphicon-record"></span>&nbsp;&nbsp;管理消息</p></div></div></div><div class="panel panel-default" ng-if="!isSubAccount || jurisdiction.new_tag ||jurisdiction.view_tag"><div class="panel-heading" data-parent="#accordion" data-toggle="collapse" data-target="#sadminTag"><p class="panel-title"><span class="glyphicon glyphicon-tags"></span>&nbsp;&nbsp;标签管理</p></div><div class="secondMenu collapse" id="sadminTag" ng-class="{in:$state.includes(\'sadminTag\')}"><div class="panel-body lefterNavItem"><p ui-sref="sadminTag.sadminNewTag" ng-if="!isSubAccount || jurisdiction.new_tag" ng-class="{sidebarBcg:$state.includes(\'sadminTag.sadminNewTag\')}"><span class="glyphicon glyphicon-plus"></span>&nbsp;&nbsp;新增标签</p><p ui-sref="sadminTag.sadminAppTag" ng-if="!isSubAccount || jurisdiction.view_tag" ng-class="{sidebarBcg:$state.includes(\'sadminTag.sadminAppTag\')}"><span class="glyphicon glyphicon-tag"></span>&nbsp;&nbsp;应用标签</p></div></div></div><div class="panel panel-default" ng-if="!isSubAccount"><div class="panel-heading" data-toggle="collapse" data-parent="#accordion" data-target="#superAccount"><p class="panel-title"><span class="glyphicon glyphicon-file"></span>&nbsp;&nbsp;权限管理</p></div><div class="secondMenu collapse" ng-class="{in:$state.includes(\'superAccount\')}" id="superAccount"><div class="panel-body"><p ui-sref="superAccount.superSubAccount" ng-class="{sidebarBcg : $state.includes(\'superAccount.superSubAccount\')}"><span class="glyphicon glyphicon-record"></span>&nbsp;&nbsp;子账户</p></div></div></div></div>');

  $templateCache.put('sadminLogAd.html', '<div class="panel panel-default"><div class="panel-heading"><p class="clearfix"><input type="search" ng-model="search.login_id" placeholder="根据用户ID搜索" class="searchInput"><select class="cursor_p searchInput pull-left" ng-model="search.accountType" style="width: 150px;color: #686868"><option value>--全部账户类型--</option><option value="1">--主账户--</option><option value="2">--子账户--</option></select><span class="pull-right"><span class="glyphicon glyphicon-calendar" style="font-size: 24px;color:#787878;position: relative;top:7px;"></span><input class="searchInput cursor_p" type="text" readonly name="reservation" id="reservation" placeholder="根据时间搜索"></span></p></div><div class="panel-body"><table class="table table-bordered table-hover"><tr class="tableTitle"><td class="td_width80">序列</td><td class="td_width180">用户</td><td>操作人</td><td class="td_width180">团队名称</td><td class="td_width180">应用名称</td><td class="td_width120">广告类型</td><td class="td_width120">广告平台</td><td>ID</td><td class="td_width80">事件</td><td class="td_width180">日期</td></tr><tr ng-repeat="log in logs"><td class="td_width80">{{$index + 1}}</td><td class="td_width180">{{log.username}}</td><td>{{log.nickname}}</td><td class="td_width180">{{log.company}}</td><td class="td_width180">{{log.info}}</td><td class="td_width120">{{log.adType}}</td><td class="td_width120">{{log.adPlatform}}</td><td>{{log.adStrategy}}{{log.adStrategyValue}}</td><td class="td_width80">{{log.action}}</td><td class="td_width180">{{log.strCreateDate}}</td></tr></table></div></div><div class="form-group jsoneditor-form" style="position: relative"><button class="btn btn-info btn-s" style="position: absolute; top: -4px;" ng-click="exportExcel()">导出Excel文件</button></div><nav class="text-right" gen-pagination="pagination"></nav><p class="nothing" ng-if="apps.length == 0">暂无数据信息</p>');

  $templateCache.put('sadminLogLoginIn.html', '<div class="panel panel-default"><div class="panel-heading"><p class="clearfix"><input type="search" ng-model="search.login_id" placeholder="根据用户ID搜索" class="searchInput"> <span class="pull-right"><span class="glyphicon glyphicon-calendar" style="font-size: 24px;color:#787878;position: relative;top:7px;"></span><input class="searchInput cursor_p" type="text" readonly name="reservation" id="reservation" placeholder="根据时间搜索"></span></p></div><div class="panel-body"><table class="table table-bordered table-hover"><tr class="tableTitle"><td class="td_width80">序列</td><td class="td_width120">团队名称</td><td>操作人</td><td class="td_width100">IP</td><td>描述</td><td class="td_width120">登录时间</td></tr><tr ng-repeat="log in logs"><td class="td_width80">{{$index + 1}}</td><td class="td_width120">{{log.company_name}}</td><td>{{log.operator}}</td><td class="td_width200">{{log.ip}}</td><td>{{log.info}}</td><td class="td_width200">{{log.time}}</td></tr></table></div></div><nav class="text-right" gen-pagination="pagination"></nav><p class="nothing" ng-if="apps.length == 0">暂无数据信息</p>');

  $templateCache.put('sadminLogs.html', '<div class="panel panel-default"><div class="panel-heading"><p class="clearfix"><input type="search" ng-model="search.login_id" placeholder="根据用户ID搜索" class="searchInput"> <span class="pull-right"><span class="glyphicon glyphicon-calendar" style="font-size: 24px;color:#787878;position: relative;top:7px;"></span><input class="searchInput cursor_p" type="text" readonly name="reservation" id="reservation" placeholder="根据时间搜索"></span></p></div><div class="panel-body"><table class="table table-bordered table-hover"><tr class="tableTitle"><td class="td_width80">序列</td><td class="td_width120">团队名称</td><td>操作人</td><td>日志内容</td><td class="td_width120">操作时间</td></tr><tr ng-repeat="log in logs"><td class="td_width80">{{$index + 1}}</td><td class="td_width120">{{log.company_name}}</td><td>{{log.operator}}</td><td>{{log.info}}</td><td class="td_width200">{{log.time}}</td></tr></table></div></div><nav class="text-right" gen-pagination="pagination"></nav><p class="nothing" ng-if="apps.length == 0">暂无数据信息</p>');

  $templateCache.put('sadminLogSyn.html', '<div class="panel panel-default"><div class="panel-heading"><p class="clearfix"><input type="search" ng-model="search.login_id" placeholder="根据用户ID搜索" class="searchInput" ng-model-options="{debounce:{default:1000,blur:0}}"> <span class="pull-right"><span class="glyphicon glyphicon-calendar" style="font-size: 24px;color:#787878;position: relative;top:7px;"></span><input class="searchInput cursor_p" type="text" readonly name="reservation" id="reservation" placeholder="根据时间搜索"></span></p></div><div class="panel-body"><table class="table table-bordered table-hover"><tr class="tableTitle"><td class="td_width80">序列</td><td class="td_width120">团队名称</td><td>操作人</td><td>发布原因</td><td>平台</td><td>发布状态</td><td class="td_width200">发布时间</td></tr><tr ng-repeat="log in logs"><td class="td_width80">{{$index + 1}}</td><td class="td_width120">{{log.company_name}}</td><td>{{log.operator}}</td><td>{{log.reason}}</td><td ng-if="log.platform === \'1\'">android</td><td ng-if="log.platform === \'2\'">iOS</td><td>{{log.info}}</td><td class="td_width200">{{log.time}}</td></tr></table></div></div><nav class="text-right" gen-pagination="pagination"></nav><p class="nothing" ng-if="apps.length == 0">暂无数据信息</p>');

  $templateCache.put('sadminNewTag.html', '<p class="panel-title"><button class="btn btn-default" ng-click="showAddTagModel()" data-toggle="modal" data-target="#tagModal"><span class="glyphicon glyphicon-plus"></span>&nbsp;设置标签</button> &nbsp;&nbsp;&nbsp;&nbsp; <button class="btn btn-default" ng-click="publishTag()">发布标签库</button></p><p></p><div class="panel panel-default" ng-repeat="data in datas"><div class="panel-heading"><p class="panel-title"><button class="btn btn-default" ng-click="showClassificationModel(data.classification)" data-toggle="modal" data-target="#classificationModel">{{data.classification}}</button></p></div><div class="panel-body"><label class="btn btn-default tagStyle" ng-repeat="tag in data.tags" ng-mouseleave="flag = false" ng-mouseenter="flag = true">{{tag.name}} <a class="delTag" ng-click="delTag(tag.tagId, tag.name)" ng-if="flag">x</a> <a class="editTag glyphicon glyphicon-edit" ng-click="showUpdateTagModel(data.classification, tag.name, tag.tagId)" data-toggle="modal" data-target="#tagModal" ng-if="flag"></a></label> <button class="btn btn-default" ng-click="showAddTagModel1(data.classification)" data-toggle="modal" data-target="#tagModal1"><span class="glyphicon glyphicon-plus"></span></button></div></div><div class="modal fade" id="tagModal"><div class="modal-content modal-dialog"><div class="modal-header"><p><a class="close" data-dismiss="modal">×</a></p></div><div class="modal-body clearfix" ng-if="isAddNewTag"><label class="control-label col-md-3 text-right">标签分类：</label><div class="col-md-8"><input class="form-control" ng-model="newTag.classification"></div></div><div class="modal-body clearfix"><label class="control-label col-md-3 text-right">标签名称：</label><div class="col-md-8"><input class="form-control" ng-model="newTag.name"></div></div><div class="modal-footer"><button ng-if="isAddNewTag" class="btn btn-info" ng-click="setNewTag()">确&nbsp;&nbsp;定</button> <button ng-if="!isAddNewTag" class="btn btn-info" ng-click="updateTag(newTag._id.$oid)">编&nbsp;&nbsp;辑</button></div></div></div><div class="modal fade" id="tagModal1"><div class="modal-content modal-dialog"><div class="modal-header"><p><a class="close" data-dismiss="modal">×</a></p></div><div class="modal-body clearfix"><label class="control-label col-md-3 text-right">标签名称：</label><div class="col-md-8"><input class="form-control" ng-model="newTag.name"></div></div><div class="modal-footer"><button class="btn btn-info" ng-click="setNewTag()">确&nbsp;&nbsp;定</button></div></div></div><div class="modal fade" id="classificationModel"><div class="modal-content modal-dialog"><div class="modal-header"><p><a class="close" data-dismiss="modal">×</a></p></div><div class="modal-body clearfix"><label class="control-label col-md-3 text-right">标签分类：</label><div class="col-md-8"><input class="form-control" ng-model="newTag.classification"></div></div><div class="modal-footer"><button class="btn btn-info" ng-click="setNewClassification()">确&nbsp;&nbsp;定</button></div></div></div>');

  $templateCache.put('sadminNoticeInfo.html', '<div class="panel panel-default form-group"><div class="panel-heading"><p class="panel-title"><button class="btn btn-info" data-target="#editNoticeInfo" data-toggle="modal" ng-click="addNoticeInfoModal()"><span class="glyphicon glyphicon-plus"></span>&nbsp;点击新增</button></p></div><div class="panel-body" ng-if="infos.length !== 0"><table class="table table-bordered table-hover"><tr class="tableTitle"><td>序号</td><td class="td_width200">创建时间</td><td>主题</td><td class="td_width200">操作</td></tr><tr ng-repeat="info in infos"><td>{{$index+1}}</td><td class="td_width200">{{info.ctime}}</td><td>{{info.title}}</td><td class="td_width200"><a href class="glyphicon glyphicon-eye-open" data-target="#editNoticeInfo" data-toggle="modal" ng-click="showNoticeInfoModal($index)">查看内容</a>&nbsp;&nbsp; <a href class="glyphicon glyphicon-remove cursor_p" ng-click="delNoticeInfo(info._id.$oid, $index)">删除</a></td></tr></table></div></div><p class="nothing" ng-if="infos.length == 0">暂无数据信息</p><nav class="text-right" gen-pagination="pagination"></nav><div class="modal fade modalPosition" id="editNoticeInfo"><div class="modal-content modal-dialog"><div class="modal-header"><p><a class="close" data-dismiss="modal">×</a></p></div><div class="modal-body clearfix"><div class="form-group"><span class="modalSpan">主题：</span> <input ng-if="isAddNewInfo" class="modalInput" ng-model="showInfo.title"> <input ng-if="!isAddNewInfo" class="modalInput" ng-model="showInfo.title" disabled></div><div class="form-group"><span class="modalSpan">内容：</span> <textarea ng-if="isAddNewInfo" ng-model="showInfo.content" class="paramTextarea"></textarea> <textarea ng-if="!isAddNewInfo" ng-model="showInfo.content" class="paramTextarea" disabled></textarea></div><div class="bg-danger clearfix panel-body" ng-if="errors.length != 0"><p style="text-indent: 10px;" class="text-danger" ng-repeat="error in errors">error : {{error.error}}</p></div></div><div class="modal-footer"><button ng-if="isAddNewInfo" class="btn btn-info" ng-click="addNoticeInfo()"><span class="glyphicon glyphicon-send"></span>&nbsp;&nbsp;保存</button></div></div></div>');

  $templateCache.put('sadminParamCtrlInfo.html', '<div class="panel panel-default"><div class="panel-heading"><p class="panel-title"><button class="btn btn-default" ng-click="showAddSysCtrlParamModal()" data-toggle="modal" data-target="#insertParamPanel"><span class="glyphicon glyphicon-plus"></span>&nbsp;系统控制参数</button></p></div><table class="table table-bordered table-hover" ng-if="sysCtrlParams.length !== 0"><tr class="tableTitle"><td class="td_width200">参数名称</td><td class="td_width300">参数值</td><td>备注</td><td class="td_width120">ctrl</td></tr><tr ng-repeat="param in sysCtrlParams"><td class="td_width200">{{param.key}}</td><td class="td_width300">{{param.value}}</td><td>{{param.note}}</td><td class="td_width120"><a class="glyphicon glyphicon-edit cursor_p" ng-click="showUpdateCtrlParamModal(param)" data-toggle="modal" data-target="#updateParamPanel">编辑</a>&nbsp;&nbsp; <a class="glyphicon glyphicon-edit cursor_p" ng-click="delCtrlSysParam(param, $index)">删除</a>&nbsp;&nbsp;</td></tr></table></div><div class="panel panel-default"><div class="panel-heading"><p class="panel-title"><button class="btn btn-default" ng-click="showAddUserCtrlParamModal()" data-toggle="modal" data-target="#insertParamPanel"><span class="glyphicon glyphicon-plus"></span>&nbsp;普通控制参数</button></p></div><table class="table table-bordered table-hover" ng-if="userCtrlParams.length !== 0"><tr class="tableTitle"><td class="td_width200">参数名称</td><td class="td_width300">参数值</td><td>备注</td><td class="td_width120">ctrl</td></tr><tr ng-repeat="param in userCtrlParams"><td class="td_width200">{{param.key}}</td><td class="td_width300">{{param.value}}</td><td>{{param.note}}</td><td class="td_width120"><a class="glyphicon glyphicon-edit cursor_p" ng-click="showUpdateCtrlParamModal(param)" data-toggle="modal" data-target="#updateParamPanel">编辑</a>&nbsp;&nbsp; <a class="glyphicon glyphicon-edit cursor_p" ng-click="delCtrlUserParam(param, $index)">删除</a>&nbsp;&nbsp;</td></tr></table></div><div class="panel panel-default"><div class="panel-heading"><p class="panel-title"><button class="btn btn-default" ng-click="showAddCtrlParamModal()" data-toggle="modal" data-target="#insertParamPanel"><span class="glyphicon glyphicon-plus"></span>&nbsp;个性化参数</button></p></div><table class="table table-bordered table-hover" ng-if="ctrlParams.length !== 0"><tr class="tableTitle"><td class="td_width200">参数名称</td><td class="td_width300">参数值</td><td>备注</td><td class="td_width120">ctrl</td></tr><tr ng-repeat="param in ctrlParams"><td class="td_width200">{{param.key}}</td><td class="td_width300">{{param.value}}</td><td>{{param.note}}</td><td class="td_width120"><a class="glyphicon glyphicon-edit cursor_p" ng-click="showUpdateCtrlParamModal(param)" data-toggle="modal" data-target="#updateCustomParamPanel">编辑</a>&nbsp;&nbsp; <a class="glyphicon glyphicon-edit cursor_p" ng-click="delCtrlParam(param, $index)">删除</a>&nbsp;&nbsp;</td></tr></table></div><div class="modal fade" id="updateParamPanel"><div class="modal-content modal-dialog"><div class="modal-header"><p><a class="close" data-dismiss="modal">×</a></p></div><div class="modal-body clearfix"><div class="form-group clearfix"><label class="col-sm-2 control-label text-right" style="padding:0;">参数名称：</label><div class="col-sm-10"><input type="text" class="form-control" ng-model="updateParam.key" disabled></div></div><div class="form-group clearfix"><label class="col-sm-2 control-label text-right" style="padding:0;">备注：</label><div class="col-sm-10"><input type="text" class="form-control" ng-model="updateParam.note"></div></div><div class="clearfix"><label class="col-sm-2 control-label text-right" style="padding:0;">参数值：</label><div class="col-sm-10"><textarea ng-if="updateParam.type === \'1\'" ng-model="updateParam.value" class="paramTextarea"></textarea><div ng-if="updateParam.type !== \'1\'" ng-jsoneditor ng-model="updateParam.value" options="options" class="height300"></div></div></div></div><div class="modal-footer"><button class="btn btn-info" data-dismiss="modal" ng-click="updateCtrlParam()">保&nbsp;&nbsp;存</button></div></div></div><div class="modal fade" id="updateCustomParamPanel"><div class="modal-content modal-dialog"><div class="modal-header"><p><a class="close" data-dismiss="modal">×</a></p></div><div class="modal-body clearfix"><div class="form-group clearfix"><label class="col-sm-2 control-label text-right" style="padding:0;">参数名称：</label><div class="col-sm-10"><input type="text" class="form-control" ng-model="updateParam.key" disabled></div></div><div class="form-group clearfix"><label class="col-sm-2 control-label text-right" style="padding:0;">备注：</label><div class="col-sm-10"><input type="text" class="form-control" ng-model="updateParam.note"></div></div><div class="form-group clearfix"><label class="col-sm-2 control-label text-right" style="padding:0;">参数值：</label><div class="col-sm-10"><textarea type="text" rows="15" class="form-control" ng-model="updateParam.value"></textarea></div></div><div class="form-group clearfix"><label class="col-sm-2 control-label text-right" style="padding:0;">选择用户：</label><div class="col-sm-10"><select type="text" rows="15" class="form-control" ng-model="pubid" ng-options="user.pubid as user.login_id for user in users"><option value>——请选择用户——</option></select></div></div></div><div class="modal-footer"><button class="btn btn-info" ng-click="updateCtrlParam()">保&nbsp;&nbsp;存</button></div></div></div><div class="modal fade" id="insertParamPanel"><div class="modal-content modal-dialog"><div class="modal-header"><p><a class="close" data-dismiss="modal">×</a></p></div><div class="modal-body clearfix"><div ng-if="addParam.level === \'1\'" class="form-group clearfix"><label class="col-sm-2 control-label text-right" style="padding:0;">参数类型:</label><div class="col-sm-10"><select class="form-control" ng-model="addParam.type"><option value="1">String</option><option value="2" class="cursor_p">JSON数组</option><option value="3" class="cursor_p">JSON对象</option></select></div></div><div class="form-group clearfix"><label class="col-sm-2 control-label text-right" style="padding:0;">参数名称：</label><div class="col-sm-10"><input type="text" class="form-control" ng-model="addParam.key"></div></div><div class="form-group clearfix"><label class="col-sm-2 control-label text-right" style="padding:0;">备注：</label><div class="col-sm-10"><input type="text" class="form-control" ng-model="addParam.note"></div></div><div class="clearfix" ng-if="addParam.level === \'1\'"><label class="col-sm-2 control-label text-right" style="padding:0;">参数值：</label><div class="col-sm-10"><textarea ng-if="addParam.type === \'1\'" type="text" rows="15" class="form-control" ng-model="addParam.value"></textarea><div ng-if="addParam.type !== \'1\'" ng-jsoneditor ng-model="addParam.value" options="options" class="height300"></div></div></div><div class="bg-danger clearfix panel-body" ng-if="errors.length != 0"><p style="text-indent: 10px;" class="text-danger" ng-repeat="error in errors">error : {{error.error}}</p></div></div><div class="modal-footer"><button class="btn btn-info" ng-click="addCtrlParam()">保&nbsp;&nbsp;存</button></div></div></div>');

  $templateCache.put('sadminParamInjectInfo.html', '<div class="panel panel-default"><div class="panel-heading"><p class="panel-title"><button class="btn btn-default" data-toggle="modal" ng-click="showAddInjectParamModal()" data-target="#paramInjectPanel"><span class="glyphicon glyphicon-plus"></span>&nbsp;新增注入参数</button></p></div><table class="table table-bordered table-hover" ng-if="injectParams.length !== 0"><tr class="tableTitle"><td>参数名称</td><td class="td_width180">开关状态</td><td>通用条件</td><td>个性化条件</td><td class="td_width180">操作</td></tr><tr ng-repeat="param in injectParams"><td>{{param.name}}</td><td class="td_width180">{{param.switch}}</td><td>{{param.in_condition}}</td><td ng-if="param.paramtype === \'0\'">{{param.open_condition}}</td><td ng-if="param.paramtype === \'1\'">无公有条件</td><td class="td_width180"><a class="glyphicon glyphicon-edit cursor_p" ng-click="showUpdateInjectParamModal($index)" data-toggle="modal" data-target="#paramInjectPanel">编辑</a> <a class="glyphicon glyphicon-edit cursor_p" ng-click="delInjectParam($index)">删除</a></td></tr></table></div><div class="modal fade" id="paramInjectPanel"><div class="modal-dialog modal-content"><div class="modal-header"><p><a class="close" data-dismiss="modal">×</a></p></div><div class="modal-body"><div class="form-group clearfix"><label class="col-sm-3 control-label text-right">参数名称：</label><div class="col-sm-9"><input type="text" ng-if="!isAddParam" class="form-control" placeholder="参数名称" ng-model="param.name" disabled> <input type="text" ng-if="isAddParam" class="form-control" placeholder="参数名称" ng-model="param.name"></div></div><div class="form-group clearfix" ng-if="isAddParam"><label class="col-sm-3 control-label text-right">参数类型：</label><div class="col-sm-9"><select class="form-control" placeholder="参数类型" ng-model="param.paramtype"><option value="0" class="cursor_p">有公有条件</option><option value="1" class="cursor_p">无公有条件</option></select></div></div><div class="form-group clearfix"><label class="col-sm-3 control-label text-right">开关状态：</label><div class="col-sm-9"><input type="text" class="form-control" placeholder="参数开关项，0表示关闭，1表示开启" ng-model="param.switch"></div></div><div class="form-group clearfix" ng-if="param.paramtype === \'0\'"><label class="col-sm-3 control-label text-right">公有条件：</label><div class="col-sm-9"><input type="text" class="form-control" placeholder="条件设置" ng-model="param.open_condition"></div></div><div class="form-group clearfix"><label class="col-sm-3 control-label text-right">私有条件：</label><div class="col-sm-9"><input class="form-control" placeholder="条件设置" ng-model="param.in_condition"></div></div><div class="form-group clearfix"><label class="col-sm-3 control-label text-right">备注：</label><div class="col-sm-9"><input type="text" class="form-control" ng-model="param.note"></div></div><div class="bg-danger clearfix panel-body" ng-if="errors.length != 0"><p style="text-indent: 10px;" class="text-danger" ng-repeat="error in errors">error : {{error.error}}</p></div></div><div class="modal-footer"><button ng-if="!isAddParam" class="btn btn-info" ng-click="updateInjectParam()">保&nbsp;&nbsp;存</button> <button ng-if="isAddParam" class="btn btn-info" ng-click="addInjectParam()">保&nbsp;&nbsp;存</button></div></div></div>');

  $templateCache.put('sadminPrivateAdInfo.html', '<div class="panel panel-default form-group"><div class="panel-heading"><span class="panel-title">广告策略列表</span> <input type="search" placeholder="按策略名称搜索" ng-model="condition.query" class="searchInput" ng-model-options="{debounce:{default:1000,blur:0}}"></div><div class="panel-body"><table class="table table-hover table-bordered"><tr class="tableTitle"><td class="text-center td_width180">策略名称</td><td class="td_width180">应用账号</td><td class="td_width120">是否过期</td><td class="td_width120">使用者</td><td>创建时间</td><td class="td_width120">创建人</td><td class="text-center td_width180">操作</td></tr><tr ng-repeat="adStrategy in adStrategys"><td class="text-center td_width180">{{adStrategy.name}}</td><td class="td_width180">{{adStrategy.accountname}}</td><td class="td_width120" ng-if="adStrategy.outdate === \'0\'">未过期</td><td class="td_width120" ng-if="adStrategy.outdate === \'1\'">已过期</td><td class="td_width120">{{adStrategy.owner}}</td><td>{{adStrategy.ctime}}</td><td class="td_width120">{{adStrategy.creator}}</td><td class="text-center td_width180"><a href data-toggle="modal" ng-click="showUpdateModal(adStrategy)" data-target="#showUpdateModal" style="width:80px;">编&nbsp;辑</a>&nbsp;&nbsp;&nbsp;<a href ng-click="delAdStrategy($index, adStrategy._id.$oid, adStrategy.accountname)" style="width:80px;">删&nbsp;除</a>&nbsp;&nbsp;&nbsp;</td></tr></table></div></div><nav class="text-right" gen-pagination="pagination"></nav><p class="nothing" ng-if="adStrategys.length == 0">暂无数据信息</p><div class="modal fade height100" id="showUpdateModal"><div class="modal-content height100"><div class="modal-header"><p><a class="close" data-dismiss="modal">×</a></p></div><div class="modal-body height100"><p>广告策略名称:&nbsp;<input type="text" class="searchInput" ng-model="newName"></p><div ng-jsoneditor ng-model="mystrategy.value" options="options" style="height: 85%!important;"></div></div><button class="btn btn-info returnJson" ng-click="updateAdStrategy()">保&nbsp;&nbsp;存</button></div></div><div class="modal fade" id="copyStrategyModal"><div class="modal-content modal-dialog"><div class="modal-header"><p><a class="close" data-dismiss="modal">×</a></p></div><div class="modal-body"><div class="clearfix"><span>策略名称：</span> <input ng-model="copystrategy.name" class="searchInput" style="width:480px;"></div></div><div class="modal-footer"><button class="btn btn-info" ng-click="copyAdStrategy()">确&nbsp;&nbsp;定</button></div></div></div>');

  $templateCache.put('sadminPrivateAdInsert.html', '<div class="form-group clearfix" ng-if="user.pub_level === \'0\'"><label class="col-sm-1 control-label text-right" style="padding:0;">选择用户：</label><div class="col-sm-2"><select type="text" rows="15" class="form-control" ng-model="pubid" ng-options="user.pubid as user.showName for user in users"><option value>——请选择用户——</option></select></div></div><div ng-jsoneditor ng-model="data" options="options" class="jsontxt"></div><div class="form-group" style="position: relative"><ng-file-input mode="text" callback="callback(file)" class="ng-file-input"></ng-file-input><button class="btn btn-info btn-s" style="position: absolute; top: -4px;" ng-click="submit()">保&nbsp;&nbsp;存</button> <button class="btn btn-info btn-s" style="position: absolute; top: -4px; left: 220px;" data-toggle="modal" data-target="#fullpage">全&nbsp;&nbsp;屏</button></div><div class="modal fade height100" id="fullpage"><div class="modal-content height100"><div class="modal-body height100"><div ng-jsoneditor ng-model="data" options="options" class="jsontxt height100"></div></div><button class="btn btn-info returnJson" data-dismiss="modal">返&nbsp;&nbsp;回</button></div></div><div class="bg-danger clearfix panel-body" ng-if="errors.length != 0"><p style="text-indent: 10px;" class="text-danger" ng-repeat="error in errors">error : {{error.error}}</p></div>');

  $templateCache.put('sadminResetPwd.html', '<form class="form-signin" novalidate><div class="loginBg"><div class="siginInPosition"><div class="panel-body signInWrap loginWrap"><p class="text-center text-info" style="margin-bottom:30px;">请重置您的密码</p><div class="form-group text-center"><input class="form-control" type="email" placeholder="邮箱ID" ng-model="userPasSet.logname" id="username" disabled></div><div class="form-group text-center"><input class="form-control" type="password" placeholder="原始密码" name="userPasSet.logpwd" ng-model="userPasSet.logpwd" ng-minlength="6" ng-maxlength="20" gen-tooltip="validateTooltip" required></div><div class="form-group text-center"><input class="form-control" type="password" placeholder="重置密码" name="userPasSet.restpwd" ng-model="userPasSet.restpwd" ng-minlength="6" ng-maxlength="20" gen-tooltip="validateTooltip" required></div><div class="row text-center"><div class="col-sm-offset-2 col-sm-8"><button class="btn btn-info form-control" type="submit" ng-click="submit()">重&nbsp;&nbsp;&nbsp;置</button></div></div></div></div></div></form>');

  $templateCache.put('sadminRighter.html', '<div ui-view></div>');

  $templateCache.put('sadminStatistics.html', '<div class="panel panel-default statistics-panel"><div class="panel-heading clearfix"><div class="panel-title app-select-container"><select name="app-select" id="app-select" class="form-control" ng-model="condition.pubid" ng-options="user.pubid as user.company_name for user in users"></select></div><div class="panel-title app-select-container"><select name="app-select" id="app-select2" class="form-control" ng-model="condition.pname" ng-options="app.pkgname as app.name for app in apps" ng-disabled="condition.moreOfferType === \'1\'"><option selected value>--被推广App--</option></select></div><div class="panel-title app-select-container" ng-if="condition.adtype === \'more\' || condition.adtype === \'offer\'"><select name="app-select" class="form-control" ng-model="condition.moreOfferType"><option selected value="0">--展示--</option><option selected value="1">--点击安装--</option></select></div><div class="date-select-container app-select-container" role="date-opt"><select name="date-select" id="date-select" class="form-control" ng-model="queryDate"><option value="1" ng-if="condition.adtype ===\'pic\'">昨天</option><option value="2" ng-if="condition.adtype ===\'pic\'">前天</option><option value="3">过去3天</option><option value="7" ng-if="condition.adtype !==\'pic\'">过去7天</option><option value="15" ng-if="condition.adtype !==\'pic\'">过去15天</option></select></div><div class="panel-title app-select-container"><select name="region-select" id="region-select" class="form-control" ng-model="condition.reg" ng-options="region.code as region.name for region in regions"><option selected value>--地区--</option></select></div><div class="date-select-container app-select-container" role="date-opt" ng-if="condition.adtype === \'pic\'"><select class="form-control cursor_p" ng-model="condition.pictype"><option value>资源类型</option><option value="l">横图</option><option value="p">竖图</option><option value="ic">icon</option><option value="s">方图</option><option value="o">其他</option></select></div></div><div class="panel-body clearfix" ng-show="condition.adtype !== \'pic\'"><div id="chartContainer" style="width:100%; height:450px"></div></div><div class="table-container" ng-if="apptotal"><h4>&nbsp;宿主应用汇总</h4><table class="table table-bordered"><thead><tr><th>展示总数</th><th>点击总数</th><th>安装总数</th><th>展示点击率&nbsp;<span class="glyphicon glyphicon-info-sign" title="总点击数/总展示数"></span></th><th>点击安装率&nbsp;<span class="glyphicon glyphicon-info-sign" title="总安装数/总点击数"></span></th><th>广告类型</th><th>地区</th><th>时间(北京时间)</th></tr></thead><tbody><tr><td>{{apptotal.showtotal}}</td><td>{{apptotal.clicktotal}}</td><td>{{apptotal.installtotal}}</td><td>{{apptotal.clickrate}}</td><td>{{apptotal.installrate}}</td><td>{{apptotal.adtype}}</td><td>{{apptotal.reg}}</td><td>{{apptotal.date}}</td></tr></tbody></table></div><div class="table-container" ng-if="conversionList.length > 0"><h4>&nbsp;宿主应用推广列表&nbsp;&nbsp;&nbsp;&nbsp;<button class="btn btn-info" ng-click="exportToExcel(\'#adminAllHostApp\')">导 出</button></h4><table class="table table-bordered" id="adminHostApp"><thead><tr><th>#</th><th>宿主应用</th><th>展示</th><th>点击</th><th>安装</th><th>展示点击率&nbsp;<span class="glyphicon glyphicon-info-sign" title="当前宿主应用点击数/当前宿主应用展示总数"></span></th><th>点击安装率&nbsp;<span class="glyphicon glyphicon-info-sign" title="当前宿主应用安装数/当前宿主应用点击总数"></span></th><th>展示占比&nbsp;<span class="glyphicon glyphicon-info-sign" title="当前宿主应用上展示数/所有宿主应用展示总数"></span></th><th>点击占比&nbsp;<span class="glyphicon glyphicon-info-sign" title="当前宿主应用上点击数/所有宿主应用点击总数"></span></th><th>安装占比&nbsp;<span class="glyphicon glyphicon-info-sign" title="当前宿主应用上安装数/所有宿主应用安装总数"></span></th><th>地区</th><th>时间(北京时间)</th></tr></thead><tbody><tr ng-repeat="conversion in conversionList track by $index"><th>{{$index + 1}}</th><td>{{conversion.hname}}</td><td>{{conversion.show}}</td><td>{{conversion.click}}</td><td>{{conversion.install}}</td><td>{{conversion.clickpercent}}</td><td>{{conversion.percent}}</td><td>{{conversion.showtotalper}}</td><td>{{conversion.clicktotalper}}</td><td>{{conversion.installtotalper}}</td><td>{{conversion.reg}}</td><td>{{conversion.date}}</td></tr></tbody></table><nav class="text-right" gen-pagination="host_pagination"></nav></div><div ng-hide="true"><table id="adminAllHostApp"><thead><tr><th>#</th><th>宿主应用</th><th>展示</th><th>点击</th><th>安装</th><th>展示点击率</th><th>点击安装率</th><th>展示占比</th><th>点击占比</th><th>安装占比</th><th>地区</th><th>时间(北京时间)</th></tr></thead><tbody><tr ng-repeat="conversion in hostAppConversionList track by $index"><th>{{$index + 1}}</th><td>{{conversion.hname}}</td><td>{{conversion.show}}</td><td>{{conversion.click}}</td><td>{{conversion.install}}</td><td>{{conversion.clickpercent}}</td><td>{{conversion.percent}}</td><td>{{conversion.showtotalper}}</td><td>{{conversion.clicktotalper}}</td><td>{{conversion.installtotalper}}</td><td>{{conversion.reg}}</td><td>{{conversion.date}}</td></tr><tr><th></th><th>合计</th><td>{{apptotal.showtotal}}</td><td>{{apptotal.clicktotal}}</td><td>{{apptotal.installtotal}}</td><td>{{apptotal.clickrate}}</td><td>{{apptotal.installrate}}</td><td></td><td></td><td></td><td></td><td></td></tr></tbody></table></div><div class="panel-body" ng-if="condition.adtype === \'pic\'"><table class="table table-bordered table-hover"><tr class="tableTitle text-center cursor_p"><td>#</td><td>图片名称</td><td>点击次数</td><td>图片展示数</td><td>点击率&nbsp;<span class="glyphicon glyphicon-info-sign" title="当前应用图片的点击数/图片展示数"></span></td><td>时间(北京时间)</td><td>地区</td><td>操作</td></tr><tr ng-repeat="item in picStatisticsData | orderBy:col:desc" class="text-center" ng-if="picStatisticsData.length > 0"><td class="cursor_p" style="position: relative;">{{$index + 1}}</td><td>{{item.pic_name}}</td><td>{{item.click_num}}</td><td>{{item.show_num}}</td><td>{{item.click_rate}}</td><td>{{item.datetime}}</td><td>{{item.reg}}</td><td><a href data-target="#paramTmplBatch" data-toggle="modal" ng-click="showImg(item.pic_src)">查看图片</a></td></tr><p class="nothing" ng-if="picStatisticsData.length == 0">暂无数据信息</p></table><div class="modal fade modalPosition" id="paramTmplBatch"><div class="modal-dialog" style="width:300px;"><a class="close" ng-click="closeModel()" data-dismiss="modal" style="position:absolute;top:-15px;right:-15px;"><span class="glyphicon glyphicon-remove" style="font-color:#fff;"></span></a> <img ng-src="{{myImg}}" style="width:100%;"></div></div><nav class="text-right" gen-pagination="pagination"></nav></div></div>');

  $templateCache.put('sadminStrategyInfo.html', '<div class="panel panel-default"><div class="panel-heading"><p class="panel-title">列表详情</p></div><div class="panel-body" ng-if="campaigns.length !== 0"><table class="table table-bordered table-hover"><tr class="tableTitle"><td style="width:200px;">运营组</td><td>应用组</td><td>权重</td><td>操作</td></tr><tr ng-repeat="campaign in campaigns"><td>{{campaign.subgroup}}</td><td>{{campaign.linkid}}</td><td>{{campaign.weight}}</td><td style="width:180px;"><a ui-sref="sadminStrategy.sadminStrategyModify({optgroupid : campaign._id.$oid})" class="glyphicon glyphicon-edit">编辑</a>&nbsp;&nbsp; <a href class="glyphicon glyphicon-remove" ng-click="delCampaign(campaign._id.$oid, $index)">删除</a></td></tr></table></div></div><p class="nothing" ng-if="campaigns.length == 0">暂无数据信息</p>');

  $templateCache.put('sadminSyn.html', '<a ng-click="showModel()" data-toggle="modal" data-target="#appSyn" href>点击可视发布状态信息</a><br><a ng-click="initAppCache()">缓存同步（切勿连续点击～慎用）</a><br><a ng-click="initAppId()">初始化AppId（请再三考虑后使用，非常之危险）</a> <button class="btn btn-info" ng-if="upload" ng-click="newSynInfo()">刷新发布信息</button> <span ng-if="showDelaytime">预计发布所需时间:{{second}},请耐心等待!</span><div class="panel-body" ng-if="list.length !== 0"><table class="table table-bordered table-hover"><tr class="tableTitle listCont"><td>状态</td><td>信息</td><td>更新时间</td></tr><tr ng-repeat="info in list" class="listCont"><td ng-if="info.status === \'0\'">等待发布</td><td ng-if="info.status === \'1\'">发布完成!</td><td ng-if="info.status === \'2\'">正在发布...</td><td>{{info.info}}</td><td>{{info.utime}}</td></tr></table></div><div class="modal fade" id="appSyn"><div class="modal-content modal-dialog"><div class="modal-header"><p><a class="close" data-dismiss="modal">×</a></p></div><div class="modal-body"><div class="clearfix form-group"><label class="col-sm-3 control-label text-right">发布原因：</label><div class="col-sm-8"><textarea rows="8" class="form-control" ng-model="reason"></textarea></div></div><div ng-if="errorShow" ng-repeat="error in errors"><p class="text-center">{{error.error}}</p></div></div><div class="modal-footer"><button class="btn btn-info" ng-click="syn()">确&nbsp;&nbsp;定</button></div></div></div>');

  $templateCache.put('sadminTaskInfo.html', '<div class="panel panel-default form-group"><div class="panel-body" ng-if="tasks.length !== 0"><table class="table table-bordered table-hover"><tr class="tableTitle"><td class="td_width200">任务名称</td><td>更新时间</td><td class="td_width200">操作</td></tr><tr ng-repeat="task in tasks"><td class="td_width200">{{task.describe}}</td><td>{{task.utime}}</td><td class="td_width200"><a ui-sref="sadminTask.sadminTaskModify({optgroupid : task._id.$oid})" class="glyphicon glyphicon-edit">编辑</a>&nbsp;&nbsp; <a href class="glyphicon glyphicon-remove" ng-click="delTask(task._id.$oid, $index)">删除</a>&nbsp;&nbsp;</td></tr></table></div></div><p class="nothing" ng-if="tasks.length == 0">暂无数据信息</p><nav class="text-right" gen-pagination="pagination"></nav>');

  $templateCache.put('sadminTaskInsert.html', '<div ng-jsoneditor ng-model="data" options="options" class="jsontxt"></div><div>输入任务组描述: <input type="text" ng-model="describe" required style="width:400px;height:80px"><br></div><br><br><div class="form-group" style="position: relative"><ng-file-input mode="text" callback="callback(file)" class="ng-file-input"></ng-file-input><button class="btn btn-info btn-s" style="position: absolute; top: -4px;" ng-click="submit()">保&nbsp;&nbsp;存</button> <button class="btn btn-info btn-s" style="position: absolute; top: -4px; left: 220px;" data-toggle="modal" data-target="#fullpage">全&nbsp;&nbsp;屏</button></div><div class="bg-danger clearfix panel-body" ng-if="errors.length != 0"><p style="text-indent: 10px;" class="text-danger" ng-repeat="error in errors">error : {{error.error}}</p></div><div class="modal fade height100" id="fullpage"><div class="modal-content height100"><div class="modal-body height100"><div ng-jsoneditor ng-model="data" options="options" class="jsontxt height100"></div></div><button class="btn btn-info returnJson" data-dismiss="modal">返&nbsp;&nbsp;回</button></div></div>');

  $templateCache.put('sadminTaskModify.html', '<div class="form-group"><div ng-jsoneditor ng-model="task" options="options"></div><div><p>已添加的用户:</p><div class="form-group overflow_y" ng-class="{wraps:myusers.length !== 0}"><label ng-repeat="user in myusers" class="btn btn-default label142" ng-click="delUser($index)" title="{{user.showName}}">{{user.showName}}</label></div><p>未添加的用户:</p><div class="form-group overflow_y" ng-class="{wraps:users.length !== 0}"><label ng-repeat="user in users" class="btn btn-default label142" ng-click="addUser($index)">{{user.showName}}</label></div></div><button class="btn btn-info" ng-click="submit()">保&nbsp;&nbsp;存</button> <button class="btn btn-info btn-s" data-toggle="modal" data-target="#fullpage">全&nbsp;&nbsp;屏</button></div><div class="modal fade height100" id="fullpage"><div class="modal-content height100"><div class="modal-body height100"><div ng-jsoneditor ng-model="task" options="options" class="height100"></div></div><button class="btn btn-info returnJson" data-dismiss="modal">返&nbsp;&nbsp;回</button></div></div><div class="bg-danger clearfix panel-body" ng-if="errors.length != 0"><p style="text-indent: 10px;" class="text-danger" ng-repeat="error in errors">error : {{error.error}}</p></div>');

  $templateCache.put('sadminUsersInfo.html', '<div class="panel panel-default"><div class="panel-heading"><p class="panel-title">基本信息列表</p></div><div class="panel-body"><table class="table table-bordered table-hover"><tr class="tableTitle"><td>编号</td><td>用户名称</td><td>用户邮箱</td><td>用户电话</td><td>团队名称</td><td>开发者id</td><td>用户角色</td><td>状态</td><td>属于奇讯</td><td>操作</td></tr><tr ng-repeat="user in users"><td>{{$index +1}}</td><td>{{user.contacts}}</td><td ng-if="user.pub_level == \'1\'"><a href ng-click="switchToSubAccount(user.pubid)">{{user.login_id}}</a></td><td ng-if="user.pub_level == \'0\'">{{user.login_id}}</td><td>{{user.telephone}}</td><td ng-if="user.pub_level == \'1\'" class="td_width120">{{user.company_name}}</td><td ng-if="user.pub_level == \'0\'" class="td_width120">超管</td><td>{{user.pubid}}</td><td ng-if="user.pub_level == \'0\'">超级管理员</td><td ng-if="user.pub_level == \'1\'">普通管理员</td><td ng-if="user.state === \'0\'">开放</td><td ng-if="user.state === \'1\'">被冻结</td><td ng-if="user.interior === \'0\'">否</td><td ng-if="user.interior === \'1\'">是</td><td><a class="glyphicon glyphicon-edit cursor_p" ng-if="user.pub_level == \'1\'" data-target="#setUserState" data-toggle="modal" ng-click="showModel(user)">编辑</a>&nbsp;&nbsp; <a href ng-click="resetPassword(user.pubid, user.login_id)">重置密码</a>&nbsp;&nbsp; <a href ng-if="user.pub_level == \'1\' && user.adAuth === \'0\'" ng-click="setAdAuth($index, \'1\')">开放广告权限</a> <a href ng-if="user.pub_level == \'1\' && user.adAuth === \'1\'" ng-click="setAdAuth($index, \'0\')">关闭广告权限</a>&nbsp;&nbsp; <a href ng-if="user.pub_level == \'1\' && user.adPartAuth === \'0\'" ng-click="setAdPartAuth($index, \'1\')">开放部分广告权限</a> <a href ng-if="user.pub_level == \'1\' && user.adPartAuth === \'1\'" ng-click="setAdPartAuth($index, \'0\')">关闭部分广告权限</a> <a href ng-if="user.pub_level == \'1\' && (user.timingTaskAuth === \'0\' || user.timingTaskAuth === undefined)" ng-click="setTimingTaskAuth($index, \'1\')">开放定时任务权限</a> <a href ng-if="user.pub_level == \'1\' && user.timingTaskAuth === \'1\'" ng-click="setTimingTaskAuth($index, \'0\')">关闭定时任务权限</a></td></tr></table></div></div><p class="nothing" ng-if="users.length == 0">暂无数据信息</p><div class="modal fade" id="setUserState"><div class="modal-content modal-dialog"><div class="modal-header"><p><a class="close" data-dismiss="modal">×</a></p></div><div class="modal-body clearfix"><div class="form-group clearfix"><label class="col-sm-2 control-label text-right" style="padding:0;">用户名称：</label><div class="col-sm-10"><input type="text" class="form-control" ng-model="user.contacts" disabled></div></div><div class="form-group clearfix"><label class="col-sm-2 control-label text-right" style="padding:0;">用户邮箱：</label><div class="col-sm-10"><input type="text" class="form-control" ng-model="user.login_id" disabled></div></div><div class="form-group clearfix"><label class="col-sm-2 control-label text-right" style="padding:0;">团队名称：</label><div class="col-sm-10"><input type="text" class="form-control" ng-model="user.company_name"></div></div><div class="form-group clearfix"><label class="col-sm-2 control-label text-right" style="padding:0;">公司域名：</label><div class="col-sm-10"><input type="text" class="form-control" placeholder="注意:不填为默认" ng-model="user.domain_name"></div></div><div class="form-group clearfix"><label class="col-sm-2 control-label text-right" style="padding:0;">选择状态：</label><div class="col-sm-10"><select type="text" class="form-control" ng-model="user.state"><option value="0">——开放状态——</option><option value="1">——冻结状态——</option></select></div></div><div class="form-group clearfix"><label class="col-sm-2 control-label text-right" style="padding:0;">属于奇讯：</label><div class="col-sm-10"><select type="text" class="form-control" ng-model="user.interior"><option value="0">——否——</option><option value="1">——是——</option></select></div></div></div><div class="modal-footer"><button class="btn btn-info" ng-click="submit()">保&nbsp;&nbsp;存</button></div></div></div>');

  $templateCache.put('saminMarketInfo.html', '<div class="panel panel-default"><div class="panel-heading"><p class="panel-title"><button class="btn btn-default" ng-click="showAddModel()" data-toggle="modal" data-target="#addMarketPanel"><span class="glyphicon glyphicon-plus"></span>&nbsp;新增应用</button></p></div><table class="table table-bordered" ng-if="markets.length !== 0" style="table-layout:fixed;width: 100%;"><tr class="tableTitle"><td>名称</td><td>标识</td><td ng-if="platform === \'1\'">包名</td><td class="tdOverflow">uri</td><td class="tdOverflow">webUrl</td><td>操作</td></tr><tr ng-repeat="market in markets"><td>{{market.nickname}}</td><td>{{market.name}}</td><td ng-if="platform === \'1\'">{{market.pkgname}}</td><td class="tdOverflow" title="{{market.uri}}">{{market.uri}}</td><td class="tdOverflow" title="{{market.weburl}}">{{market.weburl}}</td><td><a class="glyphicon glyphicon-edit cursor_p" ng-click="showUpdateModel(market)" data-toggle="modal" data-target="#updateMarketPanel">编辑</a>&nbsp;&nbsp; <a class="glyphicon glyphicon-edit cursor_p" ng-click="delMarket($index)">删除</a></td></tr></table></div><div class="modal" id="updateMarketPanel"><div class="modal-content modal-dialog"><div class="modal-header"><p><a class="close" data-dismiss="modal">×</a></p></div><div class="modal-body clearfix"><div class="row form-group"><label class="control-label col-sm-2 text-right">名称：</label><div class="col-sm-10"><input class="form-control" ng-model="oldMarket.nickname"></div></div><div class="row form-group"><label class="control-label col-sm-2 text-right">标识：</label><div class="col-sm-10"><input class="form-control" ng-model="oldMarket.name" disabled></div></div><div class="row form-group" ng-if="platform === \'1\'"><label class="control-label col-sm-2 text-right">包名：</label><div class="col-sm-10"><input class="form-control" ng-model="oldMarket.pkgname"></div></div><div class="row form-group"><label class="control-label col-sm-2 text-right">uri：</label><div class="col-sm-10"><textarea ng-model="oldMarket.uri" class="marketTextarea"></textarea></div></div><div class="row form-group"><label class="control-label col-sm-2 text-right">webUrl：</label><div class="col-sm-10"><textarea ng-model="oldMarket.weburl" class="marketTextarea"></textarea></div></div></div><div class="modal-footer"><button class="btn btn-info" data-dismiss="modal" ng-click="updateMarket()">保&nbsp;&nbsp;存</button></div></div></div><div class="modal" id="addMarketPanel"><div class="modal-content modal-dialog"><div class="modal-header"><p><a class="close" data-dismiss="modal">×</a></p></div><div class="modal-body clearfix"><div class="row form-group"><label class="control-label col-sm-2 text-right">名称：</label><div class="col-sm-10"><input class="form-control" ng-model="newMarket.nickname"></div></div><div class="row form-group"><label class="control-label col-sm-2 text-right">标识：</label><div class="col-sm-10"><input class="form-control" ng-model="newMarket.name"></div></div><div class="row form-group" ng-if="platform === \'1\'"><label class="control-label col-sm-2 text-right">包名：</label><div class="col-sm-10"><input class="form-control" ng-model="newMarket.pkgname"></div></div><div class="row form-group"><label class="control-label col-sm-2 text-right">uri：</label><div class="col-sm-10"><textarea ng-model="newMarket.uri" class="marketTextarea"></textarea></div></div><div class="row form-group"><label class="control-label col-sm-2 text-right">webUrl：</label><div class="col-sm-10"><textarea ng-model="newMarket.weburl" class="marketTextarea"></textarea></div></div></div><div class="modal-footer"><button class="btn btn-info" data-dismiss="modal" ng-click="addMarket()">保&nbsp;&nbsp;存</button></div></div></div><p class="nothing" ng-if="markets.length == 0">暂无数据信息</p>');

  $templateCache.put('showAppBascInfo.html', '<div class="panel panel-default form-group"><div class="panel-heading cursor_p clearfix"><input type="search" ng-model="condition.query" placeholder="按app名称搜索" class="searchInput" ng-model-options="{debounce:{default:1000,blur:0}}"><select class="cursor_p searchInput pull-right" ng-model="condition.linkid" ng-options="linkid.linkid as linkid.linkid for linkid in linkids"><option value>--全部分组--</option></select><select class="cursor_p searchInput pull-right" ng-model="condition.mark" style="width: 150px;color: #686868"><option value>--全部标记--</option><option value="1" style="background: red;">--红色--</option><option value="2" style="background: orange">--橙色--</option><option value="3" style="background: yellow">--黄色--</option><option value="4" style="background: green">--绿色--</option><option value="5" style="background: cyan">--青色--</option><option value="6" style="background: blue">--蓝色--</option><option value="7" style="background: purple">--紫色--</option></select></div><div class="panel-body" ng-if="apps.length !== 0"><table class="table table-bordered table-hover"><tr class="tableTitle listCont"><td>ICON</td><td>应用名称</td><td>应用包名/iTunesid</td><td>APPKEY</td><td>应用组</td></tr><tr ng-repeat="app in apps" class="listCont"><td class="cursor_p"><img ngf-src="app.icon||\'img/1.png\'"></td><td ng-if="app.mark === undefined || app.mark === null || app.mark === \'0\'">{{app.name}}</td><td ng-if="app.mark !== undefined && app.mark !== null && app.mark !== \'0\'" class="mark-{{app.mark}}">{{app.name}}</td><td>{{app.pkgname}}</td><td>{{app.appkey}}</td><td>{{app.linkid}}</td></tr></table></div></div><nav class="text-right" gen-pagination="pagination"></nav><p class="nothing" ng-if="apps.length == 0">暂无数据信息</p>');

  $templateCache.put('sidebar.html', '<nav role="sidebar" class="col-sm-12"><div class="panel-group sidebar" id="accordion"><div class="panel panel-default" ng-if="!isSubAccount"><div class="panel-heading" data-toggle="collapse" data-parent="#accordion" data-target="#dashboard"><p class="panel-title"><span class="glyphicon glyphicon-home"></span>&nbsp;&nbsp;主页面板</p></div><div class="secondMenu collapse" ng-class="{in:$state.includes(\'dashboard\')}" id="dashboard"><div class="panel-body"><p ui-sref="dashboard.index" ng-if="!isSubAccount || jurisdiction.dashboard" ng-class="{sidebarBcg : $state.includes(\'dashboard.index\')}"><span class="glyphicon glyphicon-home"></span>&nbsp;&nbsp;DashBoard</p></div></div></div><div class="panel panel-default"><div class="panel-heading" data-toggle="collapse" data-parent="#accordion" data-target="#notice"><p class="panel-title"><span class="glyphicon glyphicon-info-sign"></span>&nbsp;&nbsp;系统消息 <span class="badge" style="float:right;background: #E35850;font-size: 12px;font-weight: normal;" ng-if="messagecount !== 0">{{messagecount}}</span></p></div><div class="secondMenu collapse" ng-class="{in:$state.includes(\'notice\')}" id="notice"><div class="panel-body"><p ui-sref="notice.info" ng-class="{sidebarBcg : $state.includes(\'notice.info\')}"><span class="glyphicon glyphicon-record" ng-click="cleanmessagecount()"></span>&nbsp;&nbsp;查看消息</p></div></div></div><div class="panel panel-default"><div class="panel-heading" data-toggle="collapse" data-parent="#accordion" data-target="#appCentrl"><p class="panel-title"><span class="glyphicon glyphicon-align-center"></span>&nbsp;&nbsp;应用管理</p></div><div class="secondMenu collapse" ng-class="{in:$state.includes(\'index\')}" id="appCentrl"><div class="panel-body"><p ui-sref="index.showAppBascInfo" ng-if="isSubAccount && jurisdiction.view_application" ng-class="{sidebarBcg : $state.includes(\'index.showAppBascInfo\')}"><span class="glyphicon glyphicon-eye-open"></span>&nbsp;&nbsp;查看应用</p><p ui-sref="index.appBascInfo" ng-if="!isSubAccount|| jurisdiction.managed_application" ng-class="{sidebarBcg : $state.includes(\'index.appBascInfo\')}"><span class="glyphicon glyphicon-eye-open"></span>&nbsp;&nbsp;管理应用</p><p ui-sref="index.appInsert" ng-if="!isSubAccount|| jurisdiction.new_application" ng-class="{sidebarBcg : $state.includes(\'index.appInsert\')}"><span class="glyphicon glyphicon-plus"></span>&nbsp;&nbsp;新增应用</p><p ui-sref="index.appAdStrategy" ng-if="!isSubAccount|| jurisdiction.managed_ad" ng-class="{sidebarBcg : $state.includes(\'index.appAdStrategy\')}"><span class="glyphicon glyphicon-paperclip"></span>&nbsp;&nbsp;广告管理</p><p ui-sref="index.appLink" ng-if="!isSubAccount" ng-class="{sidebarBcg : $state.includes(\'index.appLink\')}"><span class="glyphicon glyphicon-globe"></span>&nbsp;&nbsp;应用分组</p></div></div></div><div class="panel panel-default" ng-if="!isSubAccount || jurisdiction.view_strategy ||jurisdiction.new_strategy"><div class="panel-heading" data-toggle="collapse" data-parent="#accordion" data-target="#strategyCentrl"><p class="panel-title"><span class="glyphicon glyphicon-th-large"></span>&nbsp;&nbsp;投放管理</p></div><div class="secondMenu collapse" ng-class="{in:$state.includes(\'strategy\')}" id="strategyCentrl"><div class="panel-body"><p ui-sref="strategy.strategyInfo" ng-if="!isSubAccount || jurisdiction.view_strategy" ng-class="{sidebarBcg : $state.includes(\'strategy.strategyInfo\')}"><span class="glyphicon glyphicon-eye-open"></span>&nbsp;&nbsp;查看策略</p><p ui-sref="strategy.strategyInsert" ng-if="!isSubAccount || jurisdiction.new_strategy" ng-class="{sidebarBcg : $state.includes(\'strategy.strategyInsert\')}"><span class="glyphicon glyphicon-plus"></span>&nbsp;&nbsp;新增策略</p></div></div></div><div class="panel panel-default" ng-if="!isSubAccount || jurisdiction.view_task|| jurisdiction.new_task"><div class="panel-heading" data-toggle="collapse" data-parent="#accordion" data-target="#taskCentrl"><p class="panel-title"><span class="glyphicon glyphicon-th-large"></span>&nbsp;&nbsp;任务管理</p></div><div class="secondMenu collapse" ng-class="{in:$state.includes(\'task\')}" id="taskCentrl"><div class="panel-body"><p ui-sref="task.taskInfo" ng-if="!isSubAccount || jurisdiction.view_task" ng-class="{sidebarBcg : $state.includes(\'task.taskInfo\')}"><span class="glyphicon glyphicon-eye-open"></span>&nbsp;&nbsp;查看任务组</p><p ui-sref="task.taskInsert" ng-if="!isSubAccount || jurisdiction.new_task" ng-class="{sidebarBcg : $state.includes(\'task.taskInsert\')}"><span class="glyphicon glyphicon-plus"></span>&nbsp;&nbsp;新增任务组</p></div></div></div><div class="panel panel-default" ng-if="!isSubAccount || jurisdiction.publish_application || jurisdiction.status_log"><div class="panel-heading" data-toggle="collapse" data-parent="#accordion" data-target="#publishCentrl"><p class="panel-title"><span class="glyphicon glyphicon-th-large"></span>&nbsp;&nbsp;发布管理</p></div><div class="secondMenu collapse" ng-class="{in:$state.includes(\'appAndCampaignSyn\')}" id="publishCentrl"><div class="panel-body"><p ui-sref="appAndCampaignSyn.syn" ng-if="!isSubAccount || jurisdiction.publish_application" ng-class="{sidebarBcg : $state.includes(\'appAndCampaignSyn.syn\')}"><span class="glyphicon glyphicon-eye-open"></span>&nbsp;&nbsp;发布应用</p><p ui-sref="appAndCampaignSyn.synStatusLog" ng-if="!isSubAccount || jurisdiction.status_log" ng-class="{sidebarBcg : $state.includes(\'appAndCampaignSyn.synStatusLog\')}"><span class="glyphicon glyphicon-eye-open"></span>&nbsp;&nbsp;发布查询</p></div></div></div><div class="panel panel-default" ng-if="!isSubAccount || jurisdiction.view_resource||jurisdiction.upload_resource"><div class="panel-heading" data-toggle="collapse" data-parent="#accordion" data-target="#resource"><p class="panel-title"><span class="glyphicon glyphicon-bishop"></span>&nbsp;&nbsp;资源管理</p></div><div class="secondMenu collapse" ng-class="{in:$state.includes(\'resource\')}" id="resource"><div class="panel-body"><p ui-sref="resource.resourceList" ng-if="!isSubAccount || jurisdiction.view_resource" ng-class="{sidebarBcg : $state.includes(\'resource.resourceList\')}"><span class="glyphicon glyphicon-eye-open"></span>&nbsp;&nbsp;查看资源</p><p ui-sref="resource.resourceUpload" ng-if="!isSubAccount || jurisdiction.upload_resource" ng-class="{sidebarBcg : $state.includes(\'resource.resourceUpload\')}"><span class="glyphicon glyphicon-upload"></span>&nbsp;&nbsp;上传资源</p></div></div></div><div class="panel panel-default"><div class="panel-heading" data-toggle="collapse" data-parent="#accordion" data-target="#dataCentrl"><p class="panel-title"><span class="glyphicon glyphicon-info-sign"></span>&nbsp;&nbsp;统计分析</p></div><div class="secondMenu collapse" ng-class="{in:$state.includes(\'data\')}" id="dataCentrl"><div class="panel-body"><p ui-sref="data.basicStatisticsInfo" ng-class="{sidebarBcg:$state.includes(\'data.basicStatisticsInfo\')}"><span class="glyphicon glyphicon-stats"></span>&nbsp;&nbsp;概况</p><p ui-sref="data.statistics({adtype: \'0\'})" ng-class="{sidebarBcg : $state.includes(\'data.statistics\')}"><span class="glyphicon glyphicon-record"></span>&nbsp;&nbsp;整体趋势</p><p ui-sref="data.bannerStatistics({adtype: \'banner\'})" ng-class="{sidebarBcg : $state.includes(\'data.bannerStatistics\')}"><span class="glyphicon glyphicon-record"></span>&nbsp;&nbsp;Banner</p><p ui-sref="data.nativeStatistics({adtype: \'native\'})" ng-class="{sidebarBcg : $state.includes(\'data.nativeStatistics\')}"><span class="glyphicon glyphicon-record"></span>&nbsp;&nbsp;Native</p><p ui-sref="data.iconStatistics({adtype: \'icon\'})" ng-class="{sidebarBcg : $state.includes(\'data.iconStatistics\')}"><span class="glyphicon glyphicon-record"></span>&nbsp;&nbsp;Icon</p><p ui-sref="data.pushStatistics({adtype: \'push\'})" ng-class="{sidebarBcg : $state.includes(\'data.pushStatistics\')}"><span class="glyphicon glyphicon-record"></span>&nbsp;&nbsp;Push</p><p ui-sref="data.interstitialStatistics({adtype: \'interstitial\'})" ng-class="{sidebarBcg : $state.includes(\'data.interstitialStatistics\')}"><span class="glyphicon glyphicon-record"></span>&nbsp;&nbsp;Interstitial</p><p ui-sref="data.moreStatistics({adtype: \'more\'})" ng-class="{sidebarBcg : $state.includes(\'data.moreStatistics\')}"><span class="glyphicon glyphicon-record"></span>&nbsp;&nbsp;More</p><p ui-sref="data.offerStatistics({adtype: \'offer\'})" ng-class="{sidebarBcg : $state.includes(\'data.offerStatistics\')}"><span class="glyphicon glyphicon-record"></span>&nbsp;&nbsp;Offer</p><p ui-sref="data.picStatistics({adtype: \'pic\'})" ng-class="{sidebarBcg : $state.includes(\'data.picStatistics\')}"><span class="glyphicon glyphicon-record"></span>&nbsp;&nbsp;图片点击</p></div></div></div><div class="panel panel-default"><div class="panel-heading" data-toggle="collapse" data-parent="#accordion" data-target="#dcCentrl"><p class="panel-title"><span class="glyphicon glyphicon-file"></span>&nbsp;&nbsp;文档中心</p></div><div class="secondMenu collapse" ng-class="{in:$state.includes(\'document\')}" id="dcCentrl"><div class="panel-body"><p ui-sref="document.geoCode" ng-class="{sidebarBcg : $state.includes(\'document.geoCode\')}"><span class="glyphicon glyphicon-record"></span>&nbsp;&nbsp;地区代码</p><p ui-sref="document.geoextCode" ng-class="{sidebarBcg : $state.includes(\'document.geoextCode\')}"><span class="glyphicon glyphicon-record"></span>&nbsp;&nbsp;区域代码</p><p ui-sref="document.marketInfo" ng-class="{sidebarBcg : $state.includes(\'document.marketInfo\')}"><span class="glyphicon glyphicon-record"></span>&nbsp;&nbsp;市场信息</p><p ui-sref="document.language" ng-class="{sidebarBcg : $state.includes(\'document.language\')}"><span class="glyphicon glyphicon-record"></span>&nbsp;&nbsp;语言代码</p><p ui-sref="document.syscode" ng-class="{sidebarBcg : $state.includes(\'document.syscode\')}"><span class="glyphicon glyphicon-record"></span>&nbsp;&nbsp;系统编码</p><p ui-sref="document.testid" ng-class="{sidebarBcg : $state.includes(\'document.testid\')}"><span class="glyphicon glyphicon-record"></span>&nbsp;&nbsp;TESTID</p></div></div></div><div class="panel panel-default"><div class="panel-heading" data-toggle="collapse" data-parent="#accordion" data-target="#log"><p class="panel-title"><span class="glyphicon glyphicon-file"></span>&nbsp;&nbsp;操作日志</p></div><div class="secondMenu collapse" ng-class="{in:$state.includes(\'log\')}" id="log"><div class="panel-body"><p ui-sref="log.logSyn" ng-class="{sidebarBcg : $state.includes(\'log.logSyn\')}"><span class="glyphicon glyphicon-record"></span>&nbsp;&nbsp;发布日志</p></div></div></div><div class="panel panel-default" ng-if="!isSubAccount||jurisdiction.testid"><div class="panel-heading" data-toggle="collapse" data-parent="#accordion" data-target="#test"><p class="panel-title"><span class="glyphicon glyphicon-file"></span>&nbsp;&nbsp;应用测试</p></div><div class="secondMenu collapse" ng-class="{in:$state.includes(\'test\')}" id="test"><div class="panel-body"><p ui-sref="test.testApp" ng-class="{sidebarBcg : $state.includes(\'test.testApp\')}"><span class="glyphicon glyphicon-record"></span>&nbsp;&nbsp;测试id</p></div><div class="panel-body"><p ui-sref="test.testAppPub" ng-class="{sidebarBcg : $state.includes(\'test.testAppPub\')}"><span class="glyphicon glyphicon-record"></span>&nbsp;&nbsp;测试id发布</p></div></div></div><div class="panel panel-default" ng-if="!isSubAccount"><div class="panel-heading" data-toggle="collapse" data-parent="#accordion" data-target="#account"><p class="panel-title"><span class="glyphicon glyphicon-file"></span>&nbsp;&nbsp;权限管理</p></div><div class="secondMenu collapse" ng-class="{in:$state.includes(\'account\')}" id="account"><div class="panel-body"><p ui-sref="account.subAccount" ng-class="{sidebarBcg : $state.includes(\'account.subAccount\')}"><span class="glyphicon glyphicon-record"></span>&nbsp;&nbsp;子账户</p></div></div></div></div></nav>');

  $templateCache.put('statistics.html', '<div class="panel panel-default statistics-panel"><div class="panel-heading clearfix"><div class="panel-title app-select-container" ng-if="condition.moreOfferType !== \'0\'"><select name="app-select" id="app-select2" class="form-control" ng-model="condition.pname" ng-options="app.pkgname as app.name for app in apps"><option selected value>--被推广App--</option></select></div><div class="panel-title app-select-container" ng-if="condition.adtype === \'more\' || condition.adtype === \'offer\'"><select name="app-select" class="form-control" ng-model="condition.moreOfferType"><option selected value="0">--展示--</option><option selected value="1">--点击安装--</option></select></div><div class="date-select-container app-select-container" role="date-opt"><select name="date-select" id="date-select" class="form-control" ng-model="queryDate"><option value="1" ng-if="condition.adtype ===\'pic\'">昨天</option><option value="2" ng-if="condition.adtype ===\'pic\'">前天</option><option value="3">过去3天</option><option value="7" ng-if="condition.adtype !==\'pic\'">过去7天</option><option value="15" ng-if="condition.adtype !==\'pic\'">过去15天</option></select></div><div class="reg-select-container app-select-container" role="region-opt"><select name="region-select" id="region-select" class="form-control" ng-model="condition.reg" ng-options="region.code as region.name for region in regions" ng-disabled="isDisabled"><option selected value>--地区--</option></select></div><div class="date-select-container app-select-container" role="date-opt" ng-if="condition.adtype === \'pic\'"><select class="form-control cursor_p" ng-model="condition.pictype"><option value>资源类型</option><option value="l">横图</option><option value="p">竖图</option><option value="ic">icon</option><option value="s">方图</option><option value="o">其他</option></select></div><div class="date-select-container app-select-container" ng-if="condition.adtype === \'pic\'"><label class="btn btn-default text-center">查看前500条&nbsp;<input title="查看前500条" ng-model="condition.ispage" type="checkbox"></label></div><div class="date-select-container app-select-container" role="date-opt" ng-if="condition.adtype === \'pic\' && pagination.totalRow>0">&nbsp;&nbsp;&nbsp;&nbsp;<button class="btn btn-info" ng-click="exportToExcel(\'#pic_table\')">导 出</button></div></div><div class="panel-body clearfix" ng-show="condition.adtype !== \'pic\'"><div id="chartContainer" style="width:100%; height:450px"></div></div><div class="table-container" ng-if="apptotal"><h4>&nbsp;宿主应用汇总</h4><table class="table table-bordered"><thead><tr><th>展示总数</th><th>点击总数</th><th>安装总数</th><th>展示点击率&nbsp;<span class="glyphicon glyphicon-info-sign" title="总点击数/总展示数"></span></th><th>点击安装率&nbsp;<span class="glyphicon glyphicon-info-sign" title="总安装数/总点击数"></span></th><th>广告类型</th><th>地区</th><th>时间(北京时间)</th></tr></thead><tbody><tr><td>{{apptotal.showtotal}}</td><td>{{apptotal.clicktotal}}</td><td>{{apptotal.installtotal}}</td><td>{{apptotal.clickrate}}</td><td>{{apptotal.installrate}}</td><td>{{apptotal.adtype}}</td><td>{{apptotal.reg}}</td><td>{{apptotal.date}}</td></tr></tbody></table></div><div class="table-container" ng-if="conversionList.length > 0"><h4>&nbsp;宿主应用推广列表&nbsp;&nbsp;&nbsp;&nbsp;<button class="btn btn-info" ng-click="exportToExcel(\'#hostAllApp\')">导 出</button></h4><table class="table table-bordered" id="hostApp"><thead><tr><th>#</th><th>宿主应用</th><th>展示</th><th>点击</th><th>安装</th><th>展示点击率&nbsp;<span class="glyphicon glyphicon-info-sign" title="当前宿主应用点击数/当前宿主应用展示总数"></span></th><th>点击安装率&nbsp;<span class="glyphicon glyphicon-info-sign" title="当前宿主应用安装数/当前宿主应用点击总数"></span></th><th>展示占比&nbsp;<span class="glyphicon glyphicon-info-sign" title="当前宿主应用上展示数/所有宿主应用展示总数"></span></th><th>点击占比&nbsp;<span class="glyphicon glyphicon-info-sign" title="当前宿主应用上点击数/所有宿主应用点击总数"></span></th><th>安装占比&nbsp;<span class="glyphicon glyphicon-info-sign" title="当前宿主应用上安装数/所有宿主应用安装总数"></span></th><th>地区</th><th>时间(北京时间)</th></tr></thead><tbody><tr ng-repeat="conversion in conversionList track by $index"><th>{{$index + 1}}</th><td>{{conversion.hname}}</td><td>{{conversion.show}}</td><td>{{conversion.click}}</td><td>{{conversion.install}}</td><td>{{conversion.clickpercent}}</td><td>{{conversion.percent}}</td><td>{{conversion.showtotalper}}</td><td>{{conversion.clicktotalper}}</td><td>{{conversion.installtotalper}}</td><td>{{conversion.reg}}</td><td>{{conversion.date}}</td></tr></tbody></table><nav class="text-right" gen-pagination="host_pagination"></nav></div><div ng-hide="true"><table id="hostAllApp"><thead><tr><th>#</th><th>宿主应用</th><th>展示</th><th>点击</th><th>安装</th><th>展示点击率</th><th>点击安装率</th><th>展示占比</th><th>点击占比</th><th>安装占比</th><th>地区</th><th>时间(北京时间)</th></tr></thead><tbody><tr ng-repeat="conversion in hostAppConversionList track by $index"><th>{{$index + 1}}</th><td>{{conversion.hname}}</td><td>{{conversion.show}}</td><td>{{conversion.click}}</td><td>{{conversion.install}}</td><td>{{conversion.clickpercent}}</td><td>{{conversion.percent}}</td><td>{{conversion.showtotalper}}</td><td>{{conversion.clicktotalper}}</td><td>{{conversion.installtotalper}}</td><td>{{conversion.reg}}</td><td>{{conversion.date}}</td></tr><tr><th></th><th>合计</th><td>{{apptotal.showtotal}}</td><td>{{apptotal.clicktotal}}</td><td>{{apptotal.installtotal}}</td><td>{{apptotal.clickrate}}</td><td>{{apptotal.installrate}}</td><td></td><td></td><td></td><td></td><td></td></tr></tbody></table></div><div class="panel-body" ng-if="condition.adtype === \'pic\'"><table class="table table-bordered table-hover" id="pic_table"><tr class="tableTitle text-center cursor_p"><td>#</td><td>图片名称</td><td>点击次数</td><td>图片展示数</td><td>点击率&nbsp;<span class="glyphicon glyphicon-info-sign" title="当前应用图片的点击数/图片展示数"></span></td><td>时间(北京时间)</td><td>地区</td><td>操作</td></tr><tr ng-repeat="item in picStatisticsData | orderBy:col:desc" class="text-center" ng-if="picStatisticsData.length > 0"><td class="cursor_p" style="position: relative;">{{$index + 1}}</td><td>{{item.pic_name}}</td><td>{{item.click_num}}</td><td>{{item.show_num}}</td><td>{{item.click_rate}}</td><td>{{item.datetime}}</td><td>{{item.reg}}</td><td><a href data-target="#paramTmplBatch" data-toggle="modal" ng-click="showImg(item.pic_src)">查看图片</a></td></tr><p class="nothing" ng-if="picStatisticsData.length == 0">暂无数据信息</p></table><div class="modal fade modalPosition" id="paramTmplBatch"><div class="modal-dialog" style="width:300px;"><a class="close" ng-click="closeModel()" data-dismiss="modal" style="position:absolute;top:-15px;right:-15px;"><span class="glyphicon glyphicon-remove" style="font-color:#fff;"></span></a> <img ng-src="{{myImg}}" style="width:100%;"></div></div><nav class="text-right" gen-pagination="pagination"></nav></div></div>');

  $templateCache.put('statisticsInfo.html', '<div class="panel panel-default form-group statistics-panel"><div class="panel-heading"><p class="panel-title">概况-过去三天数据汇总</p></div><div class="panel-body table-container"><table class="table table-hover table-bordered"><tr class="tableTitle"><th colspan="10">开发者id:&nbsp;{{userInfo.pubid}}&nbsp;&nbsp;&nbsp;团队名称:&nbsp;{{userInfo.company_name}}</th></tr><tr><th colspan="10">时间:&nbsp;{{userInfo.reps[2].date}}</th></tr><tr style="background:#eaeaea;"><td></td><td><b>banner</b></td><td><b>icon</b></td><td><b>native</b></td><td><b>interstitial</b></td><td><b>push</b></td><td><b>video</b></td><td><b>more</b></td><td><b>offer</b></td><td><b>未知</b></td></tr><tr><td>show</td><td>{{userInfo.reps[2][2][1]}}</td><td>{{userInfo.reps[2][1][1]}}</td><td>{{userInfo.reps[2][4][1]}}</td><td>{{userInfo.reps[2][3][1]}}</td><td>{{userInfo.reps[2][8][1]}}</td><td>{{userInfo.reps[2][5][1]}}</td><td>{{userInfo.reps[2][7][1]}}</td><td>{{userInfo.reps[2][6][1]}}</td><td>{{userInfo.reps[2][0][1]}}</td></tr><tr><td>click</td><td>{{userInfo.reps[2][2][2]}}</td><td>{{userInfo.reps[2][1][2]}}</td><td>{{userInfo.reps[2][4][2]}}</td><td>{{userInfo.reps[2][3][2]}}</td><td>{{userInfo.reps[2][8][2]}}</td><td>{{userInfo.reps[2][5][2]}}</td><td>{{userInfo.reps[2][7][2]}}</td><td>{{userInfo.reps[2][6][2]}}</td><td>{{userInfo.reps[2][0][2]}}</td></tr><tr><td>install</td><td>{{userInfo.reps[2][2][3]}}</td><td>{{userInfo.reps[2][1][3]}}</td><td>{{userInfo.reps[2][4][3]}}</td><td>{{userInfo.reps[2][3][3]}}</td><td>{{userInfo.reps[2][8][3]}}</td><td>{{userInfo.reps[2][5][3]}}</td><td>{{userInfo.reps[2][7][3]}}</td><td>{{userInfo.reps[2][6][3]}}</td><td>{{userInfo.reps[2][0][3]}}</td></tr><tr><td>CTR&nbsp;<span class="glyphicon glyphicon-info-sign" title="点击总数/展示总数"></span></td><td>{{userInfo.reps[2][2].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][2].upclick}}" title="{{userInfo.reps[2][2].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][2].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[2][1].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][1].upclick}}" title="{{userInfo.reps[2][1].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][1].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[2][4].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][4].upclick}}" title="{{userInfo.reps[2][4].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][4].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[2][3].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][3].upclick}}" title="{{userInfo.reps[2][3].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][3].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[2][8].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][8].upclick}}" title="{{userInfo.reps[2][8].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][8].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[2][5].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][5].upclick}}" title="{{userInfo.reps[2][5].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][5].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[2][7].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][7].upclick}}" title="{{userInfo.reps[2][7].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][7].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[2][6].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][6].upclick}}" title="{{userInfo.reps[2][6].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][6].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[2][0].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][0].upclick}}" title="{{userInfo.reps[2][0].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][0].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td></tr><tr><td>CVR&nbsp;<span class="glyphicon glyphicon-info-sign" title="安装总数/点击总数"></span></td><td>{{userInfo.reps[2][2].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][2].upinstall}}" title="{{userInfo.reps[2][2].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][2].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[2][1].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][1].upinstall}}" title="{{userInfo.reps[2][1].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][1].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[2][4].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][4].upinstall}}" title="{{userInfo.reps[2][4].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][4].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[2][3].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][3].upinstall}}" title="{{userInfo.reps[2][3].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][3].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[2][8].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][8].upinstall}}" title="{{userInfo.reps[2][8].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][8].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[2][5].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][5].upinstall}}" title="{{userInfo.reps[2][5].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][5].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[2][7].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][7].upinstall}}" title="{{userInfo.reps[2][7].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][7].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[2][6].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][6].upinstall}}" title="{{userInfo.reps[2][6].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][6].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[2][0].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[2][0].upinstall}}" title="{{userInfo.reps[2][0].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[2][0].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td></tr><tr><th colspan="10">时间:&nbsp;{{userInfo.reps[1].date}}</th></tr><tr style="background:#eaeaea;"><td></td><td><b>banner</b></td><td><b>icon</b></td><td><b>native</b></td><td><b>interstitial</b></td><td><b>push</b></td><td><b>video</b></td><td><b>more</b></td><td><b>offer</b></td><td><b>未知</b></td></tr><tr><td>show</td><td>{{userInfo.reps[1][2][1]}}</td><td>{{userInfo.reps[1][1][1]}}</td><td>{{userInfo.reps[1][4][1]}}</td><td>{{userInfo.reps[1][3][1]}}</td><td>{{userInfo.reps[1][8][1]}}</td><td>{{userInfo.reps[1][5][1]}}</td><td>{{userInfo.reps[1][7][1]}}</td><td>{{userInfo.reps[1][6][1]}}</td><td>{{userInfo.reps[1][0][1]}}</td></tr><tr><td>click</td><td>{{userInfo.reps[1][2][2]}}</td><td>{{userInfo.reps[1][1][2]}}</td><td>{{userInfo.reps[1][4][2]}}</td><td>{{userInfo.reps[1][3][2]}}</td><td>{{userInfo.reps[1][8][2]}}</td><td>{{userInfo.reps[1][5][2]}}</td><td>{{userInfo.reps[1][7][2]}}</td><td>{{userInfo.reps[1][6][2]}}</td><td>{{userInfo.reps[1][0][2]}}</td></tr><tr><td>install</td><td>{{userInfo.reps[1][2][3]}}</td><td>{{userInfo.reps[1][1][3]}}</td><td>{{userInfo.reps[1][4][3]}}</td><td>{{userInfo.reps[1][3][3]}}</td><td>{{userInfo.reps[1][8][3]}}</td><td>{{userInfo.reps[1][5][3]}}</td><td>{{userInfo.reps[1][7][3]}}</td><td>{{userInfo.reps[1][6][3]}}</td><td>{{userInfo.reps[1][0][3]}}</td></tr><tr><td>CTR&nbsp;<span class="glyphicon glyphicon-info-sign" title="点击总数/展示总数"></span></td><td>{{userInfo.reps[1][2].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][2].upclick}}" title="{{userInfo.reps[1][2].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][2].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[1][1].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][1].upclick}}" title="{{userInfo.reps[1][1].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][1].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[1][4].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][4].upclick}}" title="{{userInfo.reps[1][4].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][4].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[1][3].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][3].upclick}}" title="{{userInfo.reps[1][3].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][3].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[1][8].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][8].upclick}}" title="{{userInfo.reps[1][8].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][8].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[1][5].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][5].upclick}}" title="{{userInfo.reps[1][5].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][5].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[1][7].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][7].upclick}}" title="{{userInfo.reps[1][7].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][7].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[1][6].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][6].upclick}}" title="{{userInfo.reps[1][6].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][6].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[1][0].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][0].upclick}}" title="{{userInfo.reps[1][0].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][0].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td></tr><tr><td>CVR&nbsp;<span class="glyphicon glyphicon-info-sign" title="安装总数/点击总数"></span></td><td>{{userInfo.reps[1][2].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][2].upinstall}}" title="{{userInfo.reps[1][2].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][2].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[1][1].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][1].upinstall}}" title="{{userInfo.reps[1][1].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][1].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[1][4].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][4].upinstall}}" title="{{userInfo.reps[1][4].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][4].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[1][3].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][3].upinstall}}" title="{{userInfo.reps[1][3].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][3].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[1][8].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][8].upinstall}}" title="{{userInfo.reps[1][8].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][8].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[1][5].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][5].upinstall}}" title="{{userInfo.reps[1][5].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][5].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[1][7].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][7].upinstall}}" title="{{userInfo.reps[1][7].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][7].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[1][6].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][6].upinstall}}" title="{{userInfo.reps[1][6].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][6].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[1][0].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[1][0].upinstall}}" title="{{userInfo.reps[1][0].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[1][0].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td></tr><tr><th colspan="10">时间:&nbsp;{{userInfo.reps[0].date}}</th></tr><tr style="background:#eaeaea;"><td></td><td><b>banner</b></td><td><b>icon</b></td><td><b>native</b></td><td><b>interstitial</b></td><td><b>push</b></td><td><b>video</b></td><td><b>more</b></td><td><b>offer</b></td><td><b>未知</b></td></tr><tr><td>show</td><td>{{userInfo.reps[0][2][1]}}</td><td>{{userInfo.reps[0][1][1]}}</td><td>{{userInfo.reps[0][4][1]}}</td><td>{{userInfo.reps[0][3][1]}}</td><td>{{userInfo.reps[0][8][1]}}</td><td>{{userInfo.reps[0][5][1]}}</td><td>{{userInfo.reps[0][7][1]}}</td><td>{{userInfo.reps[0][6][1]}}</td><td>{{userInfo.reps[0][0][1]}}</td></tr><tr><td>click</td><td>{{userInfo.reps[0][2][2]}}</td><td>{{userInfo.reps[0][1][2]}}</td><td>{{userInfo.reps[0][4][2]}}</td><td>{{userInfo.reps[0][3][2]}}</td><td>{{userInfo.reps[0][8][2]}}</td><td>{{userInfo.reps[0][5][2]}}</td><td>{{userInfo.reps[0][7][2]}}</td><td>{{userInfo.reps[0][6][2]}}</td><td>{{userInfo.reps[0][0][2]}}</td></tr><tr><td>install</td><td>{{userInfo.reps[0][2][3]}}</td><td>{{userInfo.reps[0][1][3]}}</td><td>{{userInfo.reps[0][4][3]}}</td><td>{{userInfo.reps[0][3][3]}}</td><td>{{userInfo.reps[0][8][3]}}</td><td>{{userInfo.reps[0][5][3]}}</td><td>{{userInfo.reps[0][7][3]}}</td><td>{{userInfo.reps[0][6][3]}}</td><td>{{userInfo.reps[0][0][3]}}</td></tr><tr><td>CTR&nbsp;<span class="glyphicon glyphicon-info-sign" title="点击总数/展示总数"></span></td><td>{{userInfo.reps[0][2].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][2].upclick}}" title="{{userInfo.reps[0][2].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][2].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[0][1].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][1].upclick}}" title="{{userInfo.reps[0][1].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][1].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[0][4].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][4].upclick}}" title="{{userInfo.reps[0][4].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][4].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[0][3].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][3].upclick}}" title="{{userInfo.reps[0][3].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][3].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[0][8].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][8].upclick}}" title="{{userInfo.reps[0][8].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][8].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[0][5].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][5].upclick}}" title="{{userInfo.reps[0][5].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][5].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[0][7].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][7].upclick}}" title="{{userInfo.reps[0][7].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][7].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[0][6].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][6].upclick}}" title="{{userInfo.reps[0][6].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][6].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[0][0].clickpercent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][0].upclick}}" title="{{userInfo.reps[0][0].upclick === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][0].upclick === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td></tr><tr><td>CVR&nbsp;<span class="glyphicon glyphicon-info-sign" title="安装总数/点击总数"></span></td><td>{{userInfo.reps[0][2].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][2].upinstall}}" title="{{userInfo.reps[0][2].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][2].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[0][1].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][1].upinstall}}" title="{{userInfo.reps[0][1].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][1].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[0][4].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][4].upinstall}}" title="{{userInfo.reps[0][4].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][4].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[0][3].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][3].upinstall}}" title="{{userInfo.reps[0][3].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][3].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[0][8].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][8].upinstall}}" title="{{userInfo.reps[0][8].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][8].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[0][5].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][5].upinstall}}" title="{{userInfo.reps[0][5].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][5].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[0][7].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][7].upinstall}}" title="{{userInfo.reps[0][7].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][7].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[0][6].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][6].upinstall}}" title="{{userInfo.reps[0][6].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][6].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td><td>{{userInfo.reps[0][0].percent}}&nbsp;<span class="glyphicon glyphicon-arrow-{{userInfo.reps[0][0].upinstall}}" title="{{userInfo.reps[0][0].upinstall === \'up\' ? \'相比前一天上升\' : userInfo.reps[0][0].upinstall === \'down\' ? \'相比前一天下降\' : \'\'}}"></span></td></tr></table></div></div>');

  $templateCache.put('strategyInfo.html', '<div class="panel panel-default form-group"><div class="panel-heading"><input type="search" ng-model="query" placeholder="按运营组名称搜索" class="searchInput" ng-model-options="{debounce:{default:1000,blur:0}}"></div><div class="panel-body" ng-if="campaigns.length !== 0"><table class="table table-bordered table-hover"><tr class="tableTitle"><td class="td_width200">应用组投放策略</td><td>权重</td><td>应用组</td><td class="td_width200">操作</td></tr><tr ng-repeat="campaign in campaigns"><td class="td_width200">{{campaign.subgroup}}</td><td>{{campaign.weight}}</td><td>{{campaign.linkids}}</td><td class="td_width200"><a ui-sref="strategy.strategyModify({optgroupid : campaign._id.$oid})" class="glyphicon glyphicon-edit">编辑</a>&nbsp;&nbsp; <a href class="glyphicon glyphicon-remove" ng-click="delCampaign(campaign._id.$oid, $index)">删除</a>&nbsp;&nbsp; <a href class="glyphicon glyphicon-eye-open" data-target="#pkgnames" data-toggle="modal" ng-click="showCampaignPkgname(campaign.apps, campaign.subgroup)">查看包名</a></td></tr></table></div></div><p class="nothing" ng-if="campaigns.length == 0">暂无数据信息</p><nav class="text-right" gen-pagination="pagination"></nav><div class="modal fade" id="pkgnames"><div class="modal-content modal-dialog"><div class="modal-header"><p><a class="close" data-dismiss="modal">×</a></p></div><div class="modal-body" style="height: 500px"><div class="clearfix"><label>投放策略：{{showCampaign.subgroup}}</label></div><div class="panel-body"><div class="geoPanel" style="max-height: 430px;"><table class="table table-bordered table-hover"><tr class="tableTitle listCont"><td>序号</td><td>被推广应用名</td><td>被推广应用包名/iTunesid</td></tr><tr ng-repeat="app in showCampaign.apps" class="listCont"><td>{{$index+1}}</td><td>{{app.name}}</td><td>{{app.pkgname}}</td></tr></table></div></div></div><div class="modal-footer"></div></div></div>');

  $templateCache.put('strategyInsert.html', '<div ng-jsoneditor ng-model="data" options="options" class="jsontxt"></div><div class="form-group" style="position: relative"><ng-file-input mode="text" callback="callback(file)" class="ng-file-input"></ng-file-input><button class="btn btn-info btn-s" style="position: absolute; top: -4px;" ng-click="submit()">保&nbsp;&nbsp;存</button> <button class="btn btn-info btn-s" style="position: absolute; top: -4px; left: 220px;" data-toggle="modal" data-target="#fullpage">全&nbsp;&nbsp;屏</button></div><div class="bg-danger clearfix panel-body" ng-if="errors.length != 0"><p style="text-indent: 10px;" class="text-danger" ng-repeat="error in errors">error : {{error.error}}</p></div><div class="modal fade height100" id="fullpage"><div class="modal-content height100"><div class="modal-body height100"><div ng-jsoneditor ng-model="data" options="options" class="jsontxt height100"></div></div><button class="btn btn-info returnJson" data-dismiss="modal">返&nbsp;&nbsp;回</button></div></div>');

  $templateCache.put('strategyModify.html', '<div class="form-group"><div ng-jsoneditor ng-model="campaign" options="options"></div><div ng-if="user.pub_level !== \'0\'"><p>选择应用组<span class="glyphicon glyphicon-info-sign cursor_p" title="策略将会在与之关联的应用组所包含的应用中投放"></span></p><p><span ng-repeat="linkid in linkids"><input type="checkbox" ng-checked="linkid.checked" ng-click="selectLinkid($index)">{{linkid.linkid}}&nbsp;</span></p></div><button class="btn btn-info" ng-click="submit()">保&nbsp;&nbsp;存</button> <button class="btn btn-info btn-s" data-toggle="modal" data-target="#fullpage">全&nbsp;&nbsp;屏</button></div><div class="modal fade height100" id="fullpage"><div class="modal-content height100"><div class="modal-body height100"><div ng-jsoneditor ng-model="campaign" options="options" class="height100"></div></div><button class="btn btn-info returnJson" data-dismiss="modal">返&nbsp;&nbsp;回</button></div></div><div class="bg-danger clearfix panel-body" ng-if="errors.length != 0"><p style="text-indent: 10px;" class="text-danger" ng-repeat="error in errors">error : {{error.error}}</p></div>');

  $templateCache.put('subAccount.html', '<div class="panel panel-default"><div class="panel-heading"><p class="panel-title"><button class="btn btn-default" ng-click="showAddSubAccountModal()" data-toggle="modal" data-target="#addSubAccountPanel"><span class="glyphicon glyphicon-plus"></span>&nbsp;新增子账户</button></p></div><table class="table table-bordered table-hover" ng-if="subAccounts.length !== 0"><tr class="tableTitle"><td>编号</td><td>用户名称</td><td>用户邮箱</td><td>用户电话</td><td>团队名称</td><td>开发者id</td><td>操作</td></tr><tr ng-repeat="account in subAccounts"><td>{{$index +1}}</td><td>{{account.contacts}}</td><td>{{account.login_id}}</td><td>{{account.telephone}}</td><td class="td_width120">{{account.company_name}}</td><td>{{account.pubid}}</td><td class="td_width200"><a href ng-click="resetPassword(account.subpubid, account.login_id)">重置密码</a>&nbsp;&nbsp; <a class="glyphicon glyphicon-edit cursor_p" ng-click="showEditSubAccountModal(account)" data-toggle="modal" data-target="#editSubAccountPanel">编辑</a>&nbsp;&nbsp; <a class="glyphicon glyphicon-edit cursor_p" ng-click="delSubAccount($index)">删除</a>&nbsp;&nbsp;</td></tr></table></div><p class="nothing" ng-if="subAccounts.length === 0">暂无数据信息</p><div class="modal fade" id="editSubAccountPanel"><div class="modal-content modal-dialog"><div class="modal-header"><p><a class="close" data-dismiss="modal">×</a></p>子账户权限设置</div><div class="modal-body clearfix"><div class="form-group clearfix"><label class="col-sm-2 control-label text-right" style="padding:0;">账号：</label><div class="col-sm-10"><input type="text" class="form-control" disabled ng-model="subAccount.login_id"></div></div><div><div><p>功能模块权限设置</p><span style="font-size: 20px">应用管理：</span> <input type="checkbox" ng-model="accountJurisdiction.view_application" disabled>查看应用 <input type="checkbox" ng-model="accountJurisdiction.managed_application">管理应用 <input type="checkbox" ng-model="accountJurisdiction.new_application">新增应用<br><span style="font-size: 20px">任务管理：</span> <input type="checkbox" ng-model="accountJurisdiction.view_task">查看任务组 <input type="checkbox" ng-model="accountJurisdiction.new_task">新增任务组<br><span style="font-size: 20px">发布管理：</span> <input type="checkbox" ng-model="accountJurisdiction.publish_application">发布应用 <input type="checkbox" ng-model="accountJurisdiction.status_log">发布查询<br><span style="font-size: 20px">广告管理：</span> <input type="checkbox" ng-model="accountJurisdiction.managed_ad">广告管理<br><span style="font-size: 20px">策略管理：</span> <input type="checkbox" ng-model="accountJurisdiction.view_strategy">查看策略 <input type="checkbox" ng-model="accountJurisdiction.new_strategy">新增策略<br><span style="font-size: 20px">资源管理：</span> <input type="checkbox" ng-model="accountJurisdiction.view_resource">查看资源 <input type="checkbox" ng-model="accountJurisdiction.upload_resource">上传资源<br><span style="font-size: 20px">测试管理：</span> <input type="checkbox" ng-model="accountJurisdiction.testid">测试id<br></div><p></p><div><p>应用组权限设置</p><span ng-repeat="linkid in linkids"><input type="checkbox" ng-checked="linkid.checked" ng-click="selectLinkid($index)">{{linkid.linkid}}&nbsp;</span></div></div></div><div class="modal-footer"><button class="btn btn-info" ng-click="updateSubAccountJurisdiction()">保&nbsp;&nbsp;存</button></div></div></div><div class="modal fade" id="addSubAccountPanel"><div class="modal-content modal-dialog"><div class="modal-header"><p><a class="close" data-dismiss="modal">×</a></p>子账户权限设置</div><div class="modal-body clearfix"><div class="form-group row"><label class="col-sm-2 text-right">用户邮箱:</label><div class="col-sm-9"><input class="form-control" type="email" placeholder="邮箱ID" name="loginId" ng-model="subAccount.login_id" data-valid-name="邮箱" ui-validate="{pattern:checkEmail}" gen-tooltip="validateTooltip"></div></div><div class="form-group row"><label class="col-sm-2 text-right">用户密码:</label><div class="col-sm-9"><input class="form-control" type="password" placeholder="输入6-15位密码" data-valid-name="密码" ng-model="subAccount.password" ng-minlength="6" ng-maxlength="20" gen-tooltip="validateTooltip" required></div></div><div class="form-group row"><label class="col-sm-2 text-right">确认密码:</label><div class="col-sm-9"><input class="form-control" type="password" placeholder="确认密码" data-valid-name="密码" ng-model="subAccount.password2" ui-validate="{repasswd:\'$value==subAccount.password\'}" ui-validate-watch="\'subAccount.password\'" gen-tooltip="validateTooltip"></div></div><div class="form-group row"><label class="col-sm-2 text-right">用户昵称:</label><div class="col-sm-9"><input class="form-control" type="text" placeholder="用户昵称" data-valid-name="联系人" ng-model="subAccount.contacts" gen-tooltip="validateTooltip" required></div></div><div class="form-group row"><label class="col-sm-2 text-right">团队名称:</label><div class="col-sm-9"><input class="form-control" type="text" placeholder="团队名称" data-valid-name="团队名称" ng-model="subAccount.company_name" gen-tooltip="validateTooltip" required></div></div><div class="form-group row"><label class="col-sm-2 text-right">电话号码:</label><div class="col-sm-9"><input class="form-control" type="text" placeholder="输入有效电话" data-valid-name="电话" ui-validate="{pattern:checkTel}" ng-model="subAccount.telephone" gen-tooltip="validateTooltip"></div></div><div><div><p>功能模块权限设置</p><span style="font-size: 20px">应用管理：</span> <input type="checkbox" ng-model="accountJurisdiction.view_application" disabled>查看应用 <input type="checkbox" ng-model="accountJurisdiction.managed_application">管理应用 <input type="checkbox" ng-model="accountJurisdiction.new_application">新增应用<br><span style="font-size: 20px">任务管理：</span> <input type="checkbox" ng-model="accountJurisdiction.view_task">查看任务组 <input type="checkbox" ng-model="accountJurisdiction.new_task">新增任务组<br><span style="font-size: 20px">发布管理：</span> <input type="checkbox" ng-model="accountJurisdiction.publish_application">发布应用 <input type="checkbox" ng-model="accountJurisdiction.status_log">发布查询<br><span style="font-size: 20px">广告管理：</span> <input type="checkbox" ng-model="accountJurisdiction.managed_ad">广告管理<br><span style="font-size: 20px">策略管理：</span> <input type="checkbox" ng-model="accountJurisdiction.view_strategy">查看策略 <input type="checkbox" ng-model="accountJurisdiction.new_strategy">新增策略<br><span style="font-size: 20px">资源管理：</span> <input type="checkbox" ng-model="accountJurisdiction.view_resource">查看资源 <input type="checkbox" ng-model="accountJurisdiction.upload_resource">上传资源<br><span style="font-size: 20px">测试管理：</span> <input type="checkbox" ng-model="accountJurisdiction.testid">测试id<br></div><p></p><div><p>应用组权限设置</p><span ng-repeat="linkid in linkids"><input type="checkbox" ng-checked="linkid.checked" ng-click="selectLinkid($index)">{{linkid.linkid}}&nbsp;</span></div></div></div><div class="modal-footer"><button class="btn btn-info" ng-click="addSubAccount()">保&nbsp;&nbsp;存</button></div></div></div>');

  $templateCache.put('topbar.html', '<nav class="header form-group" role="navigation"><span><span class="cursor_p" ng-if="user.mainPubid !== undefined" ng-click="backToMainAccount()">返回超管账户</span>&nbsp;&nbsp; <span ng-if="!isSubAccount">[主账户]-{{user.company_name}}</span>&nbsp;&nbsp; <span ng-if="isSubAccount">[{{subAccountCompanyName}}]-{{user.company_name}}</span>&nbsp;&nbsp; <a ui-sref="userseting">用户设置</a>&nbsp;&nbsp; <a href ng-click="logout()">退出</a>&nbsp;&nbsp;</span><select class="cursor_p" ng-model="platform"><option value="2">iOS</option><option value="1">Android</option><option disabled>windowsPhone</option></select></nav>');

}]);