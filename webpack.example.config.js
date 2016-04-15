const webpack = require('webpack');

module.exports = {
  entry: './examples/browser.js',
  output: {
    filename: './examples/bundle.js'
  },
  resolve: {
    modulesDirectories: [
      'node_modules'
    ],
    alias: {
      http: 'stream-http',
      https: 'https-browserify'
    }
  },
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel',
      query: {
        presets: ['es2015'],
        plugins: ['transform-runtime']
      }
    }, {
      test: /\.js$/,
      include: /node_modules\/(hoek|qs|wreck|boom)/,
      loader: 'babel',
      query: {
        presets: ['es2015'],
        plugins: ['transform-runtime']
      }
    }, {
      test: /\.json$/,
      loader: 'json'
    }]
  },
  externals: {
    net: '{}',
    fs: '{}',
    tls: '{}',
    console: '{}',
    'require-dir': '{}'
  }
};
