var gulp = require('gulp');                         // gulp
var fs = require('fs');            	                // 文件操作
var gulpif = require('gulp-if');                    // 逻辑判断
var changed = require('gulp-changed');              // 过滤未变动的文件
var sass = require('gulp-sass');                    // 编译sass
var autoprefixer = require('gulp-autoprefixer');    // css自动补全前缀
var minifyCSS = require('gulp-minify-css');         // css压缩
var babel = require("gulp-babel");                  // es6=>es5
var uglify = require('gulp-uglify');                // js压缩
//var htmlminify = require("gulp-html-minify");       // html压缩
var htmlmin = require('gulp-htmlmin');              // html压缩
var imagemin = require('gulp-imagemin');            // 图片压缩
var connect = require('gulp-connect');            	// 自动刷新页面
var notify = require('gulp-notify');                // 打印消息
var plumber = require('gulp-plumber');              // 错误处理
var ejs = require("gulp-ejs");                      // ejs模板
var gutil = require('gulp-util');                   // 工具
var wait = require('gulp-wait');                    // 延时

// src
const SRC           = 'src';
const SRC_HTML      = 'src/*.html';
const SRC_IN_HTML   = 'src/include/*.html';
const SRC_JS        = 'src/js/**';
const SRC_CSS       = 'src/css/*.*';
const SRC_SCSS      = 'src/css/*.scss';
const SRC_IN_CSS    = 'src/css/include/*.scss';
const SRC_IMG       = 'src/img/*';
const SRC_FONTS     = 'src/fonts/*';

// dest
const DEST          = 'dist';
const DEST_JS       = 'dist/js';
const DEST_CSS      = 'dist/css';
const DEST_IMG      = 'dist/img';
const DEST_FONTS    = 'dist/fonts';

// 服务配置
gulp.task('server_connect', function () {
  connect.server({
    root: '../',
    port: 8081,
    livereload: true,
  });
});

// 公用方法
// 编译 html
function com_build_html(n){
	// 错误处理
  var onError = function(err) {
    notify.onError({
      title:    "Gulp Error !",
      subtitle: "Failure!",
      message:  "Error: <%= error.message %>",
      sound:    "Beep"
    })(err);
    
    // 重要！！
    this.emit('end');
  };
  
  var options = {
    removeComments: true,  //清除HTML注释
    collapseWhitespace: true,  //压缩HTML
    collapseBooleanAttributes: true,  //省略布尔属性的值 <input checked="true"/> ==> <input checked />
    removeEmptyAttributes: true,  //删除所有空格作属性值 <input id="" /> ==> <input />
    removeScriptTypeAttributes: true,  //删除<script>的type="text/javascript"
    removeStyleLinkTypeAttributes: true,  //删除<style>和<link>的type="text/css"
    minifyJS: true,  //压缩页面JS
    minifyCSS: true  //压缩页面CSS
  };
  
  gulp.src(SRC_HTML)
  .pipe(gulpif(n,changed(DEST)))
  .pipe(plumber({errorHandler: onError}))
  .pipe(ejs())
  //.pipe(htmlminify(options))
  .pipe(htmlmin(options))
  .pipe(gulp.dest(DEST))
  .pipe(connect.reload());
}

// 编译 scss
function com_build_css(n){
  gulp.src(SRC_SCSS)
  .pipe(gulpif(n, changed(DEST_CSS, { // dest 参数需要和 gulp.dest 中的参数保持一致
    extension: '.css' // 如果源文件和生成文件的后缀不同，这一行不能忘
  }), wait(200)))
  // sass()方法中先进行错误处理，然后交给autoprefixer()，否则会终止进程
  .pipe(sass({outputStyle: 'compact'}).on('error', notify.onError("Error: <%= error.message %>")))
  .pipe(autoprefixer())
  .pipe(minifyCSS())
  .pipe(gulp.dest(DEST_CSS))
  .pipe(connect.reload());
}

// 生成 html
gulp.task('build_html', function () {
	com_build_html(true);
});

// 生成 html （include文件夹）
gulp.task('build_in_html', function () {
	com_build_html(false);
});

// 生成 css
gulp.task('build_css', function () {
  // css直接输出
  gulp.src([SRC_CSS,'!' + SRC_SCSS])
    .pipe(changed(DEST_CSS))
    .pipe(gulp.dest(DEST_CSS))
    .pipe(connect.reload());

  com_build_css(true);
});

// 生成 css （include文件夹）
gulp.task('build_in_css', function () {
  com_build_css(false);
});

// 生成 js
gulp.task('build_js', function () {
  gulp.src(SRC_JS)
    .pipe(changed(DEST_JS))
    .pipe(babel())
    //.pipe(uglify())
    .pipe(gulp.dest(DEST_JS))
    .pipe(connect.reload());
});

// 生成 img
gulp.task('build_img', function () {
  gulp.src(SRC_IMG)
    .pipe(changed(DEST_IMG))
    // .pipe(imagemin({
    //   optimizationLevel: 5,   //类型：Number  默认：3  取值范围：0-7（优化等级）
    //   progressive: true,      //类型：Boolean 默认：false 无损压缩jpg图片
    //   interlaced: true,       //类型：Boolean 默认：false 隔行扫描gif进行渲染
    //   multipass: true         //类型：Boolean 默认：false 多次优化svg直到完全优化
    // }))
    .pipe(gulp.dest(DEST_IMG))
    .pipe(connect.reload());
});

// 生成 font
gulp.task('build_fonts', function () {
  gulp.src(SRC_FONTS)
    .pipe(changed(DEST_FONTS))
    .pipe(gulp.dest(DEST_FONTS))
    .pipe(connect.reload());
});

// 所有监听
gulp.task('watch_all', 
  ['build_html', 'build_js', 'build_css', 'build_img', 'build_fonts'], function () {
    gulp.watch(SRC_HTML, ['build_html']);          // 监听 html
    gulp.watch(SRC_IN_HTML, ['build_in_html']);    // 监听 html include
    gulp.watch(SRC_CSS, ['build_css']);            // 监听 css
    gulp.watch(SRC_IN_CSS, ['build_in_css']);      // 监听 css include
    gulp.watch(SRC_JS, ['build_js']);              // 监听 js
    gulp.watch(SRC_IMG, ['build_img']);            // 监听 img
    gulp.watch(SRC_FONTS, ['build_fonts']);        // 监听 fonts
    
    // 监听需要同步的文件夹
    gulp.watch([SRC_HTML, SRC_JS, SRC_CSS, SRC_IMG, SRC_FONTS], function (e) {
      // 删除文件
      if ('deleted' == e.type) {
        let file_path = e.path.replace(SRC, DEST);
        file_path = file_path.replace('.scss', '.css');
        fs.existsSync(file_path) && fs.unlink(file_path, function(){
          gutil.log(file_path + ' 文件已被删除');
        });
      }
    });
  });

// 默认任务
gulp.task('default', ['server_connect', 'watch_all']);