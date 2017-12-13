'use strict';
adBoost.controller('userLoginCtrl', ["app", "$scope", "$state", function (app, $scope, $state) {
        $scope.loginSubmit = function(){
             app.$state.go('config.productManagement');
        }
}]).controller('indexCtrl',["app","$scope","$state",function(app,$scope,$state){
        $scope.$state = $state;
}]).controller('productManagementCtrl',["app","$scope","$state",function(app,$scope,$state){
        var restAPI = app.restAPI;
        $scope.condition = {};
        $scope.pagination = {};
        $scope.condition.query = "";
        $scope.condition.linkid = "";
        //获取产品基本信息
        restAPI.app.save({
            ID:''
        },{
          "platform":app.store('platform')
        }, function (data) {
            $scope.products = data.data.products || [];
            $scope.pagination.pageSize = 15;
            $scope.pagination.totalRow = data.data.totalRow;
            $scope.pagination.pageNumber = 1;
        })
}]).controller('projectGroupManagementCtrl',["app","$scope","$state",function(app,$scope,$state){
        var restAPI = app.restAPI;
        $scope.condition = {};
        $scope.pagination = {};
        $scope.condition.query = "";
        $scope.condition.linkid = "";
        //获取项目组基本信息
        restAPI.app.save({
            ID:''
        },{
            "platform":app.store('platform')
        }, function (data) {
            $scope.projectGroups = data.data.projectGroups || [];
            $scope.pagination.pageSize = 15;
            $scope.pagination.totalRow = data.data.totalRow;
            $scope.pagination.pageNumber = 1;
        })
}]).controller('accountManagementCtrl',["app","$scope","$state",function(app,$scope,$state){
        var restAPI = app.restAPI;
        $scope.condition = {};
        $scope.pagination = {};
        $scope.condition.query = "";
        $scope.condition.linkid = "";
        //获取账户基本信息
        restAPI.app.save({
            ID:''
        }, function (data) {
            $scope.accounts = data.data.accounts || [];
            $scope.pagination.pageSize = 15;
            $scope.pagination.totalRow = data.data.totalRow;
            $scope.pagination.pageNumber = 1;
        })

}]).controller('dataImportCtrl',["app","$scope","$state",function(app,$scope,$state){
        $scope.dataImport = function(){


        }
}]).controller('dataExportCtrl',["app","$scope","$state",function(app,$scope,$state){
        var restAPI = app.restAPI;
        $scope.condition = {};
        $scope.pagination = {};
        $scope.condition.query = "";
        $scope.condition.linkid = "";
        //获取产品基本信息
        restAPI.app.save({
            ID:''
        },{
            "platform":app.store('platform')
        }, function (data) {
            $scope.products = data.data.products || [];
            $scope.pagination.pageSize = 15;
            $scope.pagination.totalRow = data.data.totalRow;
            $scope.pagination.pageNumber = 1;
        });
        $scope.dataExport = function(){


        }
}]);