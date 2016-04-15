const webpack = require('webpack');

module.exports = {
  entry: './examples/browser.js',
  output: {
    filename: './examples/bundle.js'
  },
  resolve: {
    alias: {
      fs: require.resolve('./node_modules/logplease/src/fs-mock')
    }
  },
  node: {
    console: false,
    process: 'mock'
  },
  target: 'web',
  // plugins: [
  //   new webpack.optimize.UglifyJsPlugin({
  //     mangle: true,
  //     compress: { warnings: false }
  //   })
  // ],
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: ['es2015']
        }
      }
    ]
  }
};
