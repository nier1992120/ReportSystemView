'use strict';
/*global angular*/
var adBoost = angular.module('adBoost', [
    'ngLocale',
    'ngAnimate',
    'ngResource',
    'ngCookies',
    'genTemplates',
    'ng.jsoneditor',
    'ngFileUpload',
    'adBoost.app'
]);

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
        function init() {}

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

        //app.loading = function (value, status) {
        //    $rootScope.loading.show = value;
        //    applyFn();
        //};

        //app.validate = function (scope, turnoff) {
        //    var collect = [],
        //        error = [];
        //    scope.$broadcast('genTooltipValidate', collect, turnoff);
        //    app.each(collect, function (x) {
        //        if (x.validate && x.$invalid) {
        //            error.push(x);
        //        }
        //    });
        //    if (error.length === 0) {
        //        app.validate.errorList = null;
        //        scope.$broadcast('genTooltipValidate', collect, true);
        //    } else {
        //        app.validate.errorList = error;
        //    }
        //    return !app.validate.errorList;
        //};
        //
        //app.checkDirty = function (tplObj, pristineObj, Obj) {
        //    var data = app.union(tplObj);
        //    if (data && pristineObj && Obj) {
        //        app.intersect(data, Obj);
        //        app.each(data, function (x, key, list) {
        //            if (angular.equals(x, pristineObj[key])) {
        //                delete list[key];
        //            }
        //        });
        //        app.removeItem(data, undefined);
        //        unSave.stopUnload = !app.isEmpty(data);
        //    } else {
        //        unSave.stopUnload = false;
        //    }
        //    return unSave.stopUnload ? data : null;
        //};
        //校验用户是否登录
        //app.checkUser = function () {
        //    return true;
        //    // global.isLogin = !! global.user && !! global.user.pubid;
        //};
        ////校验用户账号是否被冻结
        //app.checkUserState = function () {
        //    global.isBeFrozen = global.user.state;
        //};
        ////重置用户信息
        //app.clearUser = function () {
        //    global.user = null;
        //    app.checkUser();
        //};

        //保存app的名称
        //app.saveAppName = function (appkey) {
        //    restAPI.app.get({
        //        ID: 'getAppNameByAppkey',
        //        OP: appkey
        //    }, function (data) {
        //        $rootScope.rootAppName = data.data.name;
        //    });
        //};
        //
        //$rootScope.loading = {
        //    show: false
        //};
        //$rootScope.validateTooltip = {
        //    validate: true,
        //    validateMsg: $locale.VALIDATE
        //};
        //
        //$rootScope.isAsso = true;
        //$rootScope.existAsso = false;
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
        //
        //$rootScope.goBack = function () {
        //    window.history.go(-1);
        //};
        //
        //jqWin.resize(applyFn.bind(null, resize()));
        //
        //timing(function () { // 保证每360秒内与服务器存在连接，维持session
        //    if (Date.now() - app.timestamp - app.timeOffset >= 240000) {
        //        init();
        //    }
        //}, 120000);
        //resize();
        //init();
    }
]);
