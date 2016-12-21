var path = require("path");
module.exports = {
  entry: {
    app: ["./src/app/entry.ts"],
  },
  output: {
    path: path.resolve(__dirname, "./build/"),
    filename: "mnist-visualize-example.js",
    chunkFilename: '[chunkhash].js'
  },
  module: {
    loaders: [{
      test: /\.(styl|css)$/,
      loaders: ["style", "css", "stylus"]
    }, {
      test: /\.ts$/,
      loaders: ['babel', 'ts']
    }, {
      test   : /\.(png|jpg|gif)$/,
      loader : 'url?limit=8192'
    }, {
      test   : /\.(html|htm)$/,
      loader : 'html'
    }, {
      test   : /\.(ttf|eot|svg|woff(2)?)(\?[a-z0-9=&.]+)?$/,
      loader : 'file?name=res/[name].[ext]'
    }]
  },
  resolve: {
    root: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(__dirname, 'src', 'app'),
    ],
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js', '.html', '.css', '.styl'],
    alias: {
      'vue$': 'vue/dist/vue.js'
    }
  },
  devServer: {
    contentBase: "./build/",
  },
  htmlLoader: {
    ignoreCustomFragments: [/\{\{.*?}}/],
    root: path.resolve(__dirname, 'src', 'app'),
    attrs: ['img:src', 'link:href']
  },
  externals:[
    require('webpack-require-http')
  ]
};
