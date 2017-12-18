'use strict';
adBoost.controller('indexCtrl', ["app", "$scope", "$state", function (app, $scope, $state) {
    $scope.$state = $state;
}]).controller('userLoginCtrl', ["$scope", "$state", "restAPI", "app", function ($scope, $state, restAPI, app) {
    //用户注册
    $scope.register = function () {
        restAPI.index.get({
            ID: 'register',
            username: '$scope.username',
            password: '$scope.password',
            rememberMe: '$scope.rememberMe'
        }, function (data) {
            app.toast.info("恭喜您，注册成功");
            app.$state.go('login');
        });
    };
    //用户登录
    $scope.login = function () {
        restAPI.index.get({
            ID: 'login',
            username: 'zhaojn@game7.cc',
            password: 'zhaojn@game7.cc',
            rememberMe: 'false'
        }, function (data) {
            app.$state.go('config.projectGroupManagement');
        });
    };
    //用户登出
    $scope.userLogOut = function () {
        console.log("我要登出");
        restAPI.index.save({
            ID: 'logout'
        }, function (data) {
            app.$state.go('login');
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
                $window.location.reload();
                app.toast.info("创建成功");
            } else {
                app.toast.error("请正确填写您的项目组名称");
            }
        })
    };
    //获取项目组基本信息
    restAPI.group.get({
        ID: 'listAll'
    }, function (data) {
        $scope.projectGroups = data.data.reverse();
    });

    $scope.users = [];
    //获取用户
    restAPI.index.get({
        ID: 'allUsers'
    }, function (data) {
        $scope.users = data.data;
    });

    //选择用户
    $scope.setUser = function(u){
        console.log("aa");
        $scope.user = u;
    };
    //把用户添加到组里
    $scope.authorize = function (g) {
        console.log(g.id);
        console.log($scope.user.id);
        restAPI.group.get({
            ID: 'authorize',
            userId:  $scope.user.id,
            groupId: g.id
        }, function (data) {
            app.toast.info("授权成功");
        });
    }

}]).controller('productManagementCtrl', ["app", "$scope", "$state", "restAPI", function (app, $scope, $state, restAPI) {
    $scope.products = [];
    //创建产品
    $scope.confirmCreateProducts = function () {
        $scope.name = "";
        restAPI.product.save({
            ID: 'create'
        }, {
            name: $scope.name,
            projectGroupId: parseInt($scope.projectGroupId),
            projectGroupName: $scope.projectGroupName,
            packageName: $scope.packageName,
            platform: parseInt($scope.platform),
            cp: $scope.cp
        }, function (data) {

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
        },function (data) {
            app.toast.info("删除成功!");
        });
    }

}]).controller('accountManagementCtrl', ["app", "$scope", "$state", "restAPI", function (app, $scope, $state, restAPI) {
    $scope.users = [];
    //获取账户基本信息
    restAPI.index.get({
        ID: 'allUsers'
    }, {
        userId: $scope.userId,
        username: $scope.username,
        groups: $scope.groups
    }, function (data) {
        $scope.users = data.data
    });
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

}]).controller('dataImportCtrl', ["app", "$scope", "$state","restAPI", function (app, $scope, $state,restAPI) {
    //$scope.dataImport = function () {
    //    restAPI.product.get({
    //        ID: 'importData'
    //    }, function (data) {
    //        app.toast.info("数据导入成功!");
    //    });
    //};
    $scope.fileUploads = [];
    //导入的数据信息列表
    restAPI.product.get({
        ID: 'listRecords'
    }, function (data) {
        $scope.fileUploads = data.data;
    });

}]).controller('dataExportCtrl', ["app", "$scope", "$state", "restAPI", function (app, $scope, $state, restAPI) {
    $scope.exportDatas = [];
   // $scope.dataDay = dateFormat('')
    //获取产品基本信息
    restAPI.product.get({
        ID: 'exportDataByDay',
        strData: $scope.dataDay
    }, function (data) {
        $scope.productDatas = data.data;
    });

}]);