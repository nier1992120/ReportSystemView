'use strict';
/*global angular*/
var adBoost = angular.module('adBoost', [
    'ngLocale',
    // 'ui.router',
    'ngAnimate',
    'ngResource',
    'ngCookies',
    'ui.validate',
    'genTemplates',
    'angularFileInput',
    'ng.jsoneditor',
    'ngFileUpload',
    'adBoost.app',
    'angularModalService',
    'highcharts-ng'
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
])
    // .config(['ngClipProvider', function (ngClipProvider) {
    // ngClipProvider.setPath('static/bower_components/zeroclipboard/dist/ZeroClipboard.swf');
    // }])
.run(['app', '$q', '$rootScope', '$state', '$timeout', '$filter', 'getFile', 'JSONKit', 'toast', 'timing', 'cache', 'restAPI', 'sanitize',
     'CryptoJS', 'promiseGet', 'myConf', 'anchorScroll', 'isVisible', 'applyFn', 'param', 'store', 'i18n-zh', 'confirmDialog',
    function (app, $q, $rootScope, $state, $timeout, $filter, getFile, JSONKit, toast, timing, cache, restAPI, sanitize,
              CryptoJS, promiseGet, myConf, anchorScroll, isVisible, applyFn, param, store, $locale, confirmDialog) {
        var unSave = {
                stopUnload: false,
                nextUrl: ''
            },
            global = $rootScope.global = {
                isLogin: false,
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
            restAPI.heartbeat.get({}, function (data) {
                app.timeOffset = Date.now() - data.timestamp;
                data = data.data;
                app.union(global, data);
                app.version = global.info.version || '';
                //app.checkUser();
            });
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
        app.confirmDialog = confirmDialog;

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
            global.isLogin = !! global.user && !! global.user.pubid;
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
