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