var gulp = require('gulp');
var zip = require('gulp-zip');
var fs = require('fs');
var seq = require('run-sequence');
var del = require('del');
var webpack = require('webpack-stream');
var webpack_config = require('./webpack.config.js');
var protoc = require('gulp-protoc');

var config = JSON.parse(fs.readFileSync('./package.json'));

gulp.task('compile:protoc:python', function() {
  return gulp.src('./src/proto/**/*.proto')
    .pipe(protoc('python'))
    .pipe(gulp.dest('./gen/proto/python'));
});
gulp.task('compile:protoc:js', function() {
  return gulp.src('./src/proto/**/*.proto')
    .pipe(protoc('js'))
    .pipe(gulp.dest('./gen/proto/js'));
});
gulp.task('compile', function () {
  return gulp.src('./src/app/entry.ts')
    .pipe(webpack(webpack_config))
    .pipe(gulp.dest('./build/app/'));
});
gulp.task('copy', function () {
  return gulp.src([
    './src/app/*.html',
    './src/*.py',
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

