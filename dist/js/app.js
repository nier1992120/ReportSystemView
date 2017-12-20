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

'use strict';
adBoost.controller('indexCtrl', ["app", "$scope", "$state", "restAPI", function (app, $scope, $state, restAPI) {
    $scope.$state = $state;
    $scope.user = app.user;
    //用户登出
    $scope.userLogOut = function () {
        console.log("我要登出");
        restAPI.index.get({
            ID: 'logout'
        }, function (data) {
            app.$state.go('login');
        });
    };
}]).controller('userLoginCtrl', ["$scope", "$state", "restAPI", "app", function ($scope, $state, restAPI, app) {
    //用户登录
    app.user = null;
    $scope.loginIn = function () {
        restAPI.index.get({
            ID: 'login',
            username: $scope.username,
            password: $scope.password,
            rememberMe: $scope.rememberMe
        }, function (data) {
            app.user = data.data;
            if (data['resultCode'] == 0) {
                app.$state.go('config.projectGroupManagement');
            }
        });
    };

}]).controller('projectGroupManagementCtrl', ["app", "$scope", "$state", "restAPI", "$window", function (app, $scope, $state, restAPI, $window) {
    $scope.projectGroups = [];
    //创建项目组
    $scope.createProjectGroup = function () {
        restAPI.group.get({
            ID: 'create',
            name: $scope.projectGroup
        }, function (data) {
            if (data['resultCode'] == 0) {
                app.toast.info("创建成功");
                $window.location.reload();
            } else {
                app.toast.error("请正确填写您的项目组名称");
            }
        })
    };
    //获取项目组基本信息
    if (app.user.roles[0].roleType === 0) {
        restAPI.group.get({
            ID: 'listAll'
        }, function (data) {
            $scope.projectGroups = data.data.reverse();
        });
    } else {
        restAPI.group.get({
            ID: 'list',
            username: app.user.username
        }, function (data) {
            $scope.projectGroups = data.data.reverse();
        });
    }

    restAPI.group.get({
        ID: 'listAll'
    }, function (data) {
        $scope.projectGroups = data.data.reverse();
    });

    $scope.users = [];
    $scope.user = "";
    //获取用户
    restAPI.index.get({
        ID: 'allUsers'
    }, function (data) {
        $scope.users = data.data;
    });

    //选择用户
    $scope.setUser = function (u) {
        $scope.user = u;
    };

    //把用户添加到组里
    $scope.authorize = function (g) {
        console.log(g.id);
        console.log($scope.user.id);
        restAPI.group.get({
            ID: 'authorize',
            userId: $scope.user.id,
            groupId: g.id
        }, function (data) {
            if (data['resultCode'] == 0) {
                app.toast.info("授权成功");
            }
        });
    };

}]).controller('productManagementCtrl', ["app", "$scope", "$state", "restAPI", "$window", function (app, $scope, $state, restAPI, $window) {
    $scope.setProjectGroup = function (p) {
        console.log("下拉触发");
    };
    $scope.products = [];
    //创建产品
    $scope.confirmCreateProducts = function () {
        restAPI.product.save({
            ID: 'create'
        }, {
            name: $scope.name,
            projectGroupId: parseInt($scope.projectGroupId),
            number: $scope.number,
            //projectGroupName: $scope.projectGroupName,
            packageName: $scope.packageName,
            platform: parseInt($scope.platform),
            cp: $scope.cp
        }, function (data) {
            app.toast.info("创建成功");
            $window.location.reload();
        });
    };
    //获取产品基本信息
    restAPI.product.get({
        ID: 'list'
    }, function (data) {
        $scope.products = data.data.reverse();
    });
    //删除产品信息
    $scope.removeProduct = function (p) {
        restAPI.product.get({
            ID: 'remove'
        }, function (data) {
            app.toast.info("删除成功!");
        });
    }

}]).controller('accountManagementCtrl', ["app", "$scope", "$state", "restAPI", "$window", function (app, $scope, $state, restAPI, $window) {
    $scope.users = [];
    //获取账户基本信息
    restAPI.index.get({
        ID: 'allUsers'
    }, {
        userId: $scope.userId,
        username: $scope.username,
        groups: $scope.groups
    }, function (data) {
        $scope.users = data.data.reverse();
    });
    //创建用户
    $scope.createAccount = function () {
        restAPI.index.get({
            ID: 'register',
            username: $scope.username,
            password: $scope.password
        }, function (data) {
            $window.location.reload();
        });
        app.toast.info("用户创建成功");
    };
    //重置用户密码
    $scope.resetAccountPwd = function () {
        restAPI.index.get({
            ID: 'alterUserPwd'
        }, {
            password: $scope.password,
            newPassword: $scope.newPassword
        }, function (data) {
            app.toast.info("密码重置成功!");
        });
    }

}]).controller('dataImportCtrl', ["app", "$scope", "$state", "restAPI", function (app, $scope, $state, restAPI) {
    $scope.fileUploads = [];
    //导入的数据信息列表
    restAPI.product.get({
        ID: 'listRecords'
    }, function (data) {
        $scope.fileUploads = data.data;
    });


}]).controller('dataExportCtrl', ["app", "$scope", "$state", "restAPI", function (app, $scope, $state, restAPI) {
    $scope.exportDatas = [];
    $scope.dateDay = "20171212";
    $scope.pageSize = 15;
    $scope.pageSequence = 1;
    //罗列需要导出的数据信息
    restAPI.product.get({
        ID: 'exportDataByDay',
        strDate: $scope.dateDay,
        pageSize: $scope.pageSize,
        pageSequence: $scope.pageSequence
    }, function (data) {
        $scope.exportDatas = data.data;
    });
    //获取产品基本信息
    restAPI.product.get({
        ID: 'list',
        projectGroupName: $scope.projectGroupName,
        username: $scope.username
    }, function (data) {
        $scope.products = data.data.reverse();
    });
    //获取项目组基本信息
    restAPI.group.get({
        ID: 'listAll'
    }, function (data) {
        $scope.projectGroups = data.data.reverse();
    });
    //导入的数据信息列表
    restAPI.product.get({
        ID: 'listRecords'
    }, function (data) {
        $scope.fileUploads = data.data;
    });
    //渠道
    $scope.channels = [
        {'id': 1, 'name': 'FB'},
        {'id': 2, 'name': 'Ads'},
        {'id': 3, 'name': 'Applovin'},
        {'id': 4, 'name': 'Google'},
        {'id': 5, 'name': 'Unity'},
        {'id': 6, 'name': 'Vungle'}];
    //定义选中样式
    function changeClass() {
        $scope.className = true / false;
    }

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

'use strict';
/*global angular, adBoost, Sanitize, toastr, CryptoJS, utf8, store, JSONKit*/

adBoost
.factory('restAPI', ['$resource',
    function ($resource) {
        return {
            index:$resource('/report/index/:ID/:OP'),
            group:$resource('/report/group/:ID/:OP'),
            product:$resource('/report/product/:ID/:OP'),
            bomb:$resource('/report/bomb/:ID/:OP')
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

  $templateCache.put('accountManagement.html', '<div class="panel panel-default"><div class="panel-heading"></div><div class="table-responsive"><table class="table table-bordered table-hover"><tr><td class="width180">序号</td><td>姓名</td><td>所属项目组</td><td>用户角色</td><td class="width180">操作</td></tr><tr ng-repeat="user in users"><td class="width180">{{$index+1}}</td><td>{{user.username}}</td><td><span ng-repeat="g in user.groups">{{g.name}}、</span></td><td><span ng-repeat="role in user.roles">{{role.roleDescription}}</span></td><td class="width180"><a href data-toggle="modal" data-target="#createAccount">创建用户</a>&nbsp;&nbsp; <a href data-toggle="modal" data-target="#resetAccountPwd">重置密码</a></td></tr></table></div></div><div class="modal modal-dialog fade" id="resetAccountPwd"><div class="modal-content"><div class="modal-header"><h4 class="modal-title">重置密码 <a class="close" data-dismiss="modal">&times;</a></h4></div><div class="modal-body"><div class="form-group clearfix"><label class="col-md-2 lineHeight35">原始密码:</label><div class="col-md-10"><input type="password" class="form-control" placeholder="输入原始密码" ng-model="password"></div></div><div class="form-group clearfix"><label class="col-md-2 lineHeight35" style="line-height: 35px;">重置密码:</label><div class="col-md-10"><input type="password" class="form-control" placeholder="设置新密码" ng-model="newPassword"></div></div></div><div class="modal-footer"><button class="btn btn-primary" ng-click="resetAccountPwd()" data-dismiss="modal">密码重置</button></div></div></div><div class="modal modal-dialog fade" id="createAccount"><div class="modal-content"><div class="modal-header"><h4 class="modal-title">创建用户<a class="close" data-dismiss="modal">&times;</a></h4></div><div class="modal-body"><div class="form-group clearfix"><label class="col-md-2 lineHeight35">设置邮箱:</label><div class="col-md-10"><input type="email" class="form-control" placeholder="输入邮箱账户" ng-model="username" required></div></div><div class="form-group clearfix"><label class="col-md-2 lineHeight35" style="line-height: 35px;">设置密码:</label><div class="col-md-10"><input type="password" class="form-control" placeholder="设置密码" ng-model="password" required maxlength="20" minlength="6"></div></div></div><div class="modal-footer"><button class="btn btn-primary" ng-click="createAccount()" data-dismiss="modal">创建用户</button></div></div></div>');

  $templateCache.put('dataExport.html', '<div class="panel panel-default"><div class="panel-heading"><div class="panel-title"><button class="btn btn-primary" data-toggle="modal" data-target="#dataExportConditions">配置导出条件</button>&nbsp;&nbsp;</div></div><div class="panel-body"><div class="table-responsive"><table class="table table-bordered table-hover"><tr><td>产品名称</td><td>项目组</td><td>包名</td><td>渠道</td><td>广告名称</td><td>下载总数</td><td>总花费</td><td>平均价格</td></tr><tr ng-repeat="exportData in exportDatas"><td>{{exportData.name}}</td><td>{{exportData.group}}</td><td>{{exportData.package}}</td><td>{{exportData.channel}}</td><td>{{exportData.ad}}</td><td>{{exportData.install}}</td><td>{{exportData.expenditure}}</td><td>{{exportData.price}}</td></tr></table></div></div></div><div class="modal modal-dialog fade in" id="dataExportConditions"><div class="modal-content"><div class="modal-header"><h4 class="modal-title">导出条件设置 <a class="close" data-dismiss="modal">&times;</a></h4></div><div class="modal-body"><div class="form-group"><p>时间选择：</p><input type="date" value="2017-01-01" class="datePicker"> <input type="date" value="2020-01-01" class="datePicker"></div><div class="form-group"><p>项目组：</p><label class="btn btn-default labelWidth" title="{{p.projectGroupName}}" ng-repeat="p in products">{{p.projectGroupName}}</label></div><div class="form-group"><p>产品名称:<input type="checkbox" style="vertical-align: top" checked>&nbsp;全选</p><label class="btn btn-default labelWidth" title="{{p.name}}" ng-repeat="p in products" ng-class="{selected: app.checked}">{{p.name}}</label></div><p>渠&nbsp;&nbsp;&nbsp;&nbsp;道：<input type="checkbox" style="vertical-align: top" checked>&nbsp;全选</p><label class="btn btn-default labelWidth" ng-class title="{{channel.name}}" ng-repeat="channel in channels">{{channel.name}}</label></div><div class="modal-footer"><button class="btn btn-primary" ng-click="dataExport()" data-dismiss="modal">导出数据</button></div></div></div>');

  $templateCache.put('dataImport.html', '<div class="panel panel-default"><div class="panel-heading"><div class="panel-title clearfix"><form id="upload" action="report/product/importData" method="post" enctype="multipart/form-data"><div class="col-md-2"><input type="file" name="upload" class="fileUploadContainer"></div><div class="col-md-10"><button class="btn btn-primary" type="submit">导入数据</button></div></form></div></div><div class="panel-body"><div class="table-responsive"><table class="table table-bordered table-hover"><tr><td class="width180">序号</td><td>文件名称</td><td>文件大小</td><td>创建时间</td><td class="width180">是否移除</td></tr><tr ng-repeat="fileUpload in fileUploads"><td class="width180">{{$index+1}}</td><td>{{fileUpload.name}}</td><td>{{fileUpload.size}}</td><td>{{fileUpload.createTime| date:\'dd-MM-yy\'}}</td><td class="width180">{{fileUpload.hasRemoved}}</td></tr></table></div></div></div>');

  $templateCache.put('gen-pagination.html', '<ul class="pagination small" ng-show="total>perPages[0]"><li ng-class="{disabled: !prev}"><a ng-href="{{path&&prev?path+prev:\'\'}}" title="上一页" ng-click="paginationTo(prev)">&laquo;</a></li><li class="cursor_p" ng-class="{active: n === pageNumber, disabled: n === \'…\' || n === \'...\'}" ng-repeat="n in showPages"><a ng-href="{{path&&n!=\'…\'&&n!=pageNumber?path+n:\'\'}}" title="{{n!=\'…\'?\'第\'+n+\'页\':\'\'}}" ng-click="paginationTo(n)">{{n}}</a></li><li ng-class="{disabled: !next}"><a ng-href="{{path&&next?path+next:\'\'}}" title="下一页" ng-click="paginationTo(next)">&#187;</a></li></ul>');

  $templateCache.put('index.html', '<div><div ui-view="topbar"></div><div ui-view="sidebar" class="lefter"></div><div ui-view="mainbody" class="righter"></div></div>');

  $templateCache.put('login.html', '<form class="form-signin" novalidate><div class="loginBg"><div class="siginInPosition"><div class="panel-body signInWrap loginWrap"><p class="text-center text-info" style="margin-bottom:30px;"><b>欢迎登录 ReportSystem</b></p><div class="form-group text-center"><input class="form-control" type="email" placeholder="邮箱ID" ng-model="username" required></div><div class="form-group text-center"><input class="form-control" type="password" placeholder="账户密码" ng-model="password" ng-minlength="6" ng-maxlength="20" required></div><div class="row text-center"><div class="col-sm-offset-2 col-sm-8"><button class="btn btn-info form-control" type="submit" ng-click="loginIn()">登&nbsp;&nbsp;&nbsp;录</button></div></div><p class="clearMsg">如果出现异常，可以清理一下缓存</p></div></div></div></form>');

  $templateCache.put('mainbody.html', '<p class="form-group"><span ng-show="$state.includes(\'config\')">配置管理> <span ng-if="$state.includes(\'config.productManagement\')">产品管理</span> <span ng-if="$state.includes(\'config.projectGroupManagement\')">项目组管理</span> <span ng-if="$state.includes(\'config.accountManagement\')">账户管理</span></span> <span ng-show="$state.includes(\'datas\')">数据管理> <span ng-if="$state.includes(\'datas.dataImport\')">数据导入</span> <span ng-if="$state.includes(\'datas.dataExport\')">数据导出</span></span></p><div ui-view></div>');

  $templateCache.put('productManagement.html', '<div class="panel panel-default"><div class="panel-heading"><div class="panel-title"><button class="btn btn-primary" ng-click="createProducts()" data-toggle="modal" data-target="#createProductModal"><span class="glyphicon glyphicon-plus"></span>添加新产品</button></div></div><div class="table-responsive"><table class="table table-bordered table-hover text-center"><tr><td>项目组编号</td><td>投放编号</td><td>产品名称</td><td>包&nbsp;&nbsp;&nbsp;&nbsp;名</td><td>平台</td><td>CP</td><td>项目组</td><td>操作</td></tr><tr ng-repeat="product in products"><td>{{product.projectGroupId}}</td><td>{{product.reportNumber}}</td><td>{{product.name}}</td><td>{{product.packageName}}</td><td>{{product.platform}}</td><td>{{product.cp}}</td><td>{{product.projectGroupName}}</td><td><a href ng-click="removeProduct($index)">删除</a></td></tr></table></div></div><div class="modal modal-dialog fade in" id="createProductModal"><div class="modal-content"><div class="modal-header"><h4 class="modal-title">新增产品信息 <a class="close" data-dismiss="modal">&times;</a></h4></div><div class="modal-body"><div class="form-group clearfix"><label class="col-md-2 lineHeight35">项目组名称:</label><div class="col-md-10"><select class="form-control"><option>选择项目组</option><option ng-repeat="p in products" ng-click="setProjectGroup(p)">{{p.projectGroupName}}</option></select></div></div><div class="form-group clearfix"><label class="col-md-2 lineHeight35">投放编号:</label><div class="col-md-10"><input class="form-control" placeholder="投放项目编号" ng-model="number"></div></div><div class="form-group clearfix"><label class="col-md-2 lineHeight35">产品名称:</label><div class="col-md-10"><input class="form-control" placeholder="产品名称" ng-model="name"></div></div><div class="form-group clearfix"><label class="col-md-2 lineHeight35">包名:</label><div class="col-md-10"><input class="form-control" placeholder="包名" ng-model="packageName"></div></div><div class="form-group clearfix"><label class="col-md-2 lineHeight35">平台:</label><div class="col-md-10"><input class="form-control" placeholder="平台" ng-model="platform"></div></div><div class="form-group clearfix"><label class="col-md-2 lineHeight35">CP名称:</label><div class="col-md-10"><input class="form-control" placeholder="CP名称" ng-model="cp"></div></div></div><div class="modal-footer"><button class="btn btn-primary" ng-click="confirmCreateProducts()" data-dismiss="modal">确&nbsp;定</button></div></div></div>');

  $templateCache.put('projectGroupManagement.html', '<div class="panel panel-default"><div class="panel-heading"><div class="panel-title"><button class="btn btn-primary" ng-click="createProjectGroup()"><span class="glyphicon glyphicon-plus"></span>创建项目组</button>&nbsp;&nbsp; <input class="inputContainer" ng-model="projectGroup"> <span style="font-size: 12px">（可输入数字、字母、下划线）</span></div></div><div class="table-responsive"><table class="table table-bordered table-hover"><tr><td class="width180">序列号</td><td>项目组名称</td><td>已授权用户</td><td class="width300">用户授权名称</td></tr><tr ng-repeat="projectGroup in projectGroups"><td class="width180 lineHeight30">{{$index+1}}</td><td class="lineHeight30">{{projectGroup.name}}</td><td class="lineHeight30"><span ng-repeat="authorizedUser in projectGroup.authorizedUsers">{{authorizedUser.username}}</span></td><td class="width300"><select class="selectContainer"><option>选择要授权的用户</option><option ng-repeat="u in projectGroup.unAuthorizedUsers" ng-click="setUser(u)">{{ u.username }}</option></select>&nbsp;&nbsp; <button class="btn btn-primary" ng-click="authorize(projectGroup)">授权</button></td></tr></table></div></div>');

  $templateCache.put('sidebar.html', '<nav role="sidebar" class="col-sm-12"><div class="panel-group sidebar"><div class="panel panel-default"><div class="panel-heading" data-toggle="collapse" data-parent="#accordion" data-target="#userCentrl"><p class="panel-title"><span class="glyphicon glyphicon-globe"></span>&nbsp;&nbsp;配置管理</p></div><div class="secondMenu collapse" ng-class="{in:$state.includes(\'config\')}" id="userCentrl"><div class="panel-body"><p ui-sref="config.projectGroupManagement" ng-class="{sidebarBcg : $state.includes(\'config.projectGroupManagement\')}"><span class="glyphicon glyphicon-th-list"></span>&nbsp;&nbsp;项目组管理</p><p ui-sref="config.productManagement" ng-class="{sidebarBcg : $state.includes(\'config.productManagement\')}"><span class="glyphicon glyphicon-inbox"></span>&nbsp;&nbsp;产品管理</p><p ng-if="user.roles[0].roleType == 0" ui-sref="config.accountManagement" ng-class="{sidebarBcg : $state.includes(\'config.accountManagement\')}"><span class="glyphicon glyphicon-user"></span>&nbsp;&nbsp;账户管理</p></div></div></div><div class="panel panel-default"><div class="panel-heading" data-toggle="collapse" data-parent="#accordion" data-target="#dcCentrl"><p class="panel-title"><span class="glyphicon glyphicon-folder-open"></span>&nbsp;&nbsp;数据管理</p></div><div class="secondMenu collapse" ng-class="{in:$state.includes(\'datas\')}" id="dcCentrl"><div class="panel-body"><p ui-sref="datas.dataImport" ng-class="{sidebarBcg : $state.includes(\'datas.dataImport\')}"><span class="glyphicon glyphicon-log-in"></span>&nbsp;&nbsp;数据导入</p><p ui-sref="datas.dataExport" ng-class="{sidebarBcg : $state.includes(\'datas.dataExport\')}"><span class="glyphicon glyphicon-log-out"></span>&nbsp;&nbsp;数据导出</p></div></div></div></div></nav>');

  $templateCache.put('topbar.html', '<nav class="header form-group" role="navigation"><div class="headerContent"><span>{{}}</span>&nbsp;&nbsp; <a href ng-click="userLogOut()">退出</a></div></nav>');

}]);