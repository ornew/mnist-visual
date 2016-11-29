var gulp = require('gulp');
var zip = require('gulp-zip');
var fs = require('fs');
var seq = require('run-sequence');
var del = require('del');
var webpack = require('webpack-stream');
var webpack_config = require('./webpack.config.js');

var config = JSON.parse(fs.readFileSync('./package.json'));

gulp.task('compile', function () {
  return gulp.src('./src/app/entry.ts')
    .pipe(webpack(webpack_config))
    .pipe(gulp.dest('./build/app/'));
});
gulp.task('copy', function () {
  return gulp.src([
    './src/app/index.html',
    './src/server.py',
    './src/evalute.py',
    './src/train.py',
    './src/mnist/**/*.py'],
    { base: 'src/' })
    .pipe(gulp.dest('./build/'));
});
gulp.task('clean', function() {
  return del('./build/');
});
gulp.task('build', ['copy', 'compile']);
gulp.task('rebuild', function() {
  return seq('clean', 'build');
});
gulp.task('deploy:zip', function() {
  return gulp.src('./build/**/*', { base: './build/' })
    .pipe(zip(config.name + '_' +config.version + '.zip'))
    .pipe(gulp.dest('.'))
})
gulp.task('deploy', function(){
  return seq('clean', 'build', 'deploy:zip');
})

