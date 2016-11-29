var gulp = require('gulp');
var seq = require('run-sequence');
var del = require('del');
var webpack = require('webpack-stream');
var webpack_config = require('./webpack.config.js');

gulp.task('compile', function () {
  return gulp.src('./src/app/entry.ts')
    .pipe(webpack(webpack_config))
    .pipe(gulp.dest('./build/app/'));
});
gulp.task('copy', function () {
  return gulp.src([
    './src/app/index.html',
    './src/app/cgi-bin/**/*.py',
    './src/server.py',
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

