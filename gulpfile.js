'use strict';

var gulp = require('gulp');
var util = require('gulp-util'),
    clean = require('gulp-clean'),
    gulpSequence = require('gulp-sequence'),
    jshint = require('gulp-jshint'),
    concat = require('gulp-concat'),
    minifyCss = require('gulp-minify-css'),
    minifyHtml = require('gulp-minify-html'),
    ngTemplate = require('gulp-ng-template'),
    minifyJs = require('gulp-uglify'),
    rev = require('gulp-rev'),
    replace = require('gulp-replace'),
    usemin = require('gulp-usemin'),
    merge2 = require('merge2'),
    version = 'v' + require('./package.json').version,
    connect = require('gulp-connect'),
    watch = require('gulp-watch');

// 输出的文件根目录
var outDir = 'dist';
var baseDir = "/Users/yanli/.cache/bower/packages";

var paths = {
    styles: outDir + '/css',
    scripts: outDir + '/js',
    images: outDir + '/img',
    fonts: outDir + '/fonts',
    index: outDir + '/'
};

gulp.task('clean', function () {
    return gulp.src([outDir + '/*'])
        .pipe(clean({force: true}));
});

gulp.task('custom-css', function () {
    return gulp.src([
        'static/bower_components/toastr/toastr.min.css',
        'static/bower_components/bootstrap/dist/css/bootstrap.css',
        'static/bower_components/bootstrap-switch/dist/css/bootstrap3/bootstrap-switch.css',
        'static/bower_components/json-edit-module/jsoneditor.css',
        'static/bower_components/bootstrap-daterangepicker/daterangepicker-bs3.css',
        'static/src/css/*.css'
    ])
        .pipe(concat('app.css'))
        .pipe(replace('VERSION', version))
        .pipe(gulp.dest(paths.styles));
});

gulp.task('custom-lib', function () {
    return gulp.src([
        "static/bower_components/jquery/dist/jquery.js",
        "static/bower_components/bootstrap/dist/js/bootstrap.js",
        'static/bower_components/angular/angular.js',
        'static/bower_components/angular-animate/angular-animate.js',
        'static/bower_components/angular-cookies/angular-cookies.js',
        'static/bower_components/angular-resource/angular-resource.js',
        'static/bower_components/angular-ui-router/release/angular-ui-router.js',
        'static/bower_components/angular-i18n/angular-locale_zh-cn.js',
        'static/bower_components/ng-file-upload/ng-file-upload.js',
        'static/bower_components/toastr/toastr.js',
        'static/bower_components/utf8/utf8.js',
        'static/bower_components/store2/dist/store2.js',
        'static/bower_components/bootstrap-switch/dist/js/bootstrap-switch.js',
    ])
        .pipe(concat('lib.js'))
        .pipe(gulp.dest(paths.scripts));
});

// 定制自己的script库，将html文件一起打包
gulp.task('custom-app', function () {
    return merge2(gulp.src(['static/src/js/*.js']),
        gulp.src('static/src/tpl/*.html')
            .pipe(minifyHtml({empty: true, quotes: true}))
            .pipe(ngTemplate({
                moduleName: 'genTemplates',
                standalone: true,
                filePath: 'templates.js'
            })))
        .pipe(concat('app.js'))
        .pipe(gulp.dest(paths.scripts));
});

gulp.task('custom-images', function () {
    return gulp.src('static/src/img/*.*')
        .pipe(gulp.dest(paths.images));
});

gulp.task('custom-fonts', function () {
    return gulp.src('static/bower_components/bootstrap/dist/fonts/*')
        .pipe(gulp.dest(paths.fonts));
});

gulp.task('custom-index', function () {
    return gulp.src('static/src/index.html')
        .pipe(gulp.dest(paths.index));
});

gulp.task('custom-mine', function () {
    return gulp.src('static/bower_components/json-edit-module/**/jsoneditor-icons.svg')
        .pipe(gulp.dest(paths.styles));
});


/**
 * ************** 热部署（live reload）**************
 * by jiananzhao
 * 2017/09/18
 * note：
 * 系统默认监听8888端口，
 * if 只开发前端，则直接访问localhost:8888
 * if 联调后端，则推荐使用nginx做路由转发｛
 *      --此时nginx中监听的端口不可以是8888，
 *      --此时后端监听的端口不可以是8888，
 *      --此时访问页面的端口必定不是8888，
 *      --此时修改文件以后需要手动在页面F5，
 * ｝
 * >>>>>>> 就算不起8888端口监听，联调后端也必须手动Refresh
 */
gulp.task('watch', function () {
    gulp.watch(['static/src/img/*.*'], ['custom-images']);
    gulp.watch(['static/src/js/*.js', 'static/src/tpl/*.html'], ['custom-app']);
    gulp.watch(['static/src/css/*.css'], ['custom-css']);
    gulp.watch(['static/src/index.html'], ['custom-index']);
});

gulp.task('web-server', function () {
    connect.server({
        root: outDir,
        livereload: false,
        port: 8888
    });
});

gulp.task('live-reload', function () {
    gulp.src([outDir + '/**/*.*'])
        .pipe(watch([outDir + '/**/*.*']))
        .pipe(connect.reload());
});
/********************** live reload end **********************/

gulp.task('default', gulpSequence('clean', ['custom-css', 'custom-fonts', 'custom-lib', 'custom-app', 'custom-images', 'custom-mine'], "custom-index"));

// 深海炸弹，一运行电脑就会爆炸
gulp.task('bomb', gulpSequence('default', 'web-server', 'live-reload', 'watch'));