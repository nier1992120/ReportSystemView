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