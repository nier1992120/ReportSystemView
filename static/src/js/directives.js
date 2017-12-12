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