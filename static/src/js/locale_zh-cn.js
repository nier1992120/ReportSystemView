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