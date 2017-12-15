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
    $scope.logOut = function () {
        restAPI.index.get({
            ID: 'logOut'
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
        console.log(u);
        $scope.user = u;
    };
    //把用户添加到组里
    $scope.authorize = function (g) {
        console.log($scope.user);
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
        console.log("a");
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
            $("#createProductModal").modal('hide');
        });
    };
    //获取产品基本信息
    restAPI.product.get({
        ID: 'list'
    }, function (data) {
        $scope.products = data.data.reverse();
    });
    //删除产品信息
    $scope.remove = function (id) {
        restAPI.product.save({
            ID: 'remove'
        }, id, function (data) {
            $scope.products = data.data;
        });
        app.toast.info("删除成功!");
    }

}]).controller('accountManagementCtrl', ["app", "$scope", "$state", "restAPI", function (app, $scope, $state, restAPI) {
    $scope.users = [];
    //获取账户基本信息
    restAPI.index.get({
        ID: 'allUsers'
    }, {
        userId: $scope.userId,
        username: $scope.username,
        projectGroupName: $scope.projectGroupName
    }, function (data) {
        $scope.users = data.data
    });
    //重置用户密码
    $scope.resetAccountPwd = function (userId) {
        restAPI.index.get({
            ID: 'alterUserPwd'
        }, {
            password: $scope.password,
            newPassword: $scope.newPassword
        }, function (data) {
            app.toast.info("密码重置成功!");
        });
    }

}]).controller('dataImportCtrl', ["app", "$scope", "$state", function (app, $scope, $state) {
    $scope.dataImport = function () {
        restAPI.product.get({
            ID: 'importData'
        }, function (data) {

        });
        app.toast.info("数据导入成功!");

    }
}]).controller('dataExportCtrl', ["app", "$scope", "$state", "restAPI", function (app, $scope, $state, restAPI) {
    $scope.products = [];
    //获取产品基本信息
    restAPI.product.get({
        ID: 'list'
    }, function (data) {
        $scope.products = data.data.reverse();
    });
    //导出数据
    $scope.dataExport = function () {
        restAPI.product.get({
            ID: 'exportData'
        }, function (data) {
            app.toast.info("数据导出成功")
        });
    }
}]);