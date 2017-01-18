import fs from 'fs'
import path from 'path'
import seq from 'run-sequence'
import gulp from 'gulp'
import gutil from 'gutil'
import shell from 'gulp-shell'
import webpack from 'webpack'
import server from 'webpack-dev-server'
var zip = require('gulp-zip');
var del = require('del');
var protoc = require('gulp-protoc');

var config = {
  package: JSON.parse(fs.readFileSync('./package.json')),
  server: {
    host: '0.0.0.0',
    port: 55556,
    contentBase: path.resolve(__dirname, "./build"),
    inline: true,
    hot: true,
    historyApiFallback: {
      index: 'index.html'},
    stats: {
      colors: true}},
  webpack: {
    base: {
      entry: {
        app: ['babel-polyfill', './src/app/index.js']},
      output: {
        path: path.resolve(__dirname, "./build/app/"),
        filename: "[name].js",
        chunkFilename: '[chunkhash].js'},
      module: {
        loaders: [{
          test: /\.styl$/,
          loaders: ['style', 'css', 'stylus']
        }, {
          test: /\.css$/,
          loaders: ['style', 'css']
        }, {
          test   : /\.jsx?$/,
          exclude: /node_modules/,
          loader : 'babel',
          query: {
            presets: ['es2015', 'stage-3']
          }
        }, {
          test   : /\.(png|jpg|gif)$/,
          loader : 'url?limit=8192'
        }, {
          test   : /\.(html|htm)$/,
          loader : 'html'
        }, {
          test   : /\.vue$/,
          loader : 'vue'
        }, {
          test   : /\.(ttf|eot|svg|woff(2)?)(\?[a-z0-9=&.]+)?$/,
          loader : 'file?name=res/[name].[ext]'}]},
      resolve: {
        root: [
          path.resolve(__dirname, '../orn-web/build'),
          path.resolve(__dirname, 'src', 'app')],
        extensions: ['', '.js', '.html', '.css', '.styl', '.vue'],
        fallback: [path.resolve(__dirname, 'node_modules')],
        alias: {
          'vue$': 'vue/dist/vue.js'}},
      htmlLoader: {
        ignoreCustomFragments: [/\{\{.*?}}/],
        root: path.resolve(__dirname, 'src'),
        attrs: ['img:src', 'link:href']},
      externals:[
        require('webpack-require-http')],
      plugins: []},
    flavor: {
      debug: {
        debug: true},
      release: {
        plugins: [
          new webpack.DefinePlugin({'process.env': {NODE_ENV: '"production"'}}),
          new webpack.optimize.UglifyJsPlugin({
            compress: {warnings: false}})]}}}};

config.webpack.release = Object.assign({},
  config.webpack.base,
  config.webpack.flavor.release);
config.webpack.debug = Object.assign({},
  config.webpack.base,
  config.webpack.flavor.debug);

gulp.task("server", function(callback) {
  new server(webpack(config.webpack.debug), config.server)
    .listen(config.server.port, "localhost", function(err) {
      if(err){ throw new gutil.PluginError("webpack-dev-server", err); }
      // keep the server alive or continue?
      // callback();
    });
});
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
  return gulp.src('./src/app/entry.js')
    .pipe(webpack(webpack_config))
    .pipe(gulp.dest('./build/app/'));
});
gulp.task('copy', ['copy:app:raw'], function () {
  return gulp.src([
    './src/*.py',
    './src/mnist/**/*.py'],
    { base: 'src/' })
    .pipe(gulp.dest('./build/'));
});
gulp.task('copy:app:raw', function () {
  return gulp.src(
    ['./src/app/raw/**/*'],
    { base: 'src/app/raw/' })
    .pipe(gulp.dest('./build/app/'));
});
gulp.task('build', ['copy'], function (callback) {
  webpack(config.webpack.release,
    function(err, stats) {
      if(err){ throw new gutil.PluginError("webpack", err); }
      gutil.log("[webpack]", stats.toString({}));
      callback();
    });
});
gulp.task('clean', function() {
  return del('./build/');
});
gulp.task('rebuild', function() {
  return seq('clean', 'build');
});
const _package = `${config.package.name}_${config.package.version}`
gulp.task('deploy:copy', function() {
  return gulp.src('./build/**/*', { base: './build/' })
    .pipe(gulp.dest(`./${_package}`))
})
gulp.task('deploy:zip', ['deploy:copy'], function() {
  return gulp.src('./build/**/*', { base: './build/' })
    .pipe(zip(_package + '.zip'))
    .pipe(gulp.dest('.'))
})
gulp.task('deploy:gzip', ['deploy:copy'], shell.task([
  `tar cvzf ${_package}.tar.gz ${_package}`,
]))
gulp.task('deploy', function(){
  return seq('clean', 'build', ['deploy:zip', 'deploy:gzip']);
})

