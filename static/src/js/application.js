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
