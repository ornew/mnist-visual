var path = require("path");
module.exports = {
  entry: {
    app: ["./src/entry.ts"]
  },
  output: {
    path: path.resolve(__dirname, "../root"),
    filename: "mnist-visualize-example.js",
    chunkFilename: '[chunkhash].js'
  },
  module: {
    loaders: [{
      test: /\.(styl|css)$/,
      loaders: ["style", "css", "stylus"]
    }, {
      test: /\.ts$/,
      loaders: ["ts"]
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
    root: path.resolve(__dirname, "./src"),
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js', '.html', '.css', '.styl']
  },
  devServer: {
    contentBase: "./public",
  },
  htmlLoader: {
    ignoreCustomFragments: [/\{\{.*?}}/],
    root: path.resolve(__dirname, 'src'),
    attrs: ['img:src', 'link:href']
  },
  externals:[
    require('webpack-require-http')
  ]
};
