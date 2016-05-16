const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: './examples/browser/browser.js',
  output: {
    filename: './examples/browser/bundle.js'
  },
  resolveLoader: {
    root: path.join(__dirname, 'node_modules')
  },
  resolve: {
    modulesDirectories: [
      'node_modules',
      path.join(__dirname, 'node_modules')
    ],
    alias: {
      // fs: require.resolve('./node_modules/logplease/src/fs-mock'),
      http: 'stream-http',
      https: 'https-browserify',
      Buffer: 'buffer'
    }
  },
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules|vendor/,
      loader: 'babel',
      query: {
        presets: require.resolve('babel-preset-es2015'),
        plugins: require.resolve('babel-plugin-transform-runtime')
      }
    }, {
      test: /\.js$/,
      include: /node_modules\/(hoek|qs|wreck|boom|ipfs|)/,
      loader: 'babel',
      query: {
        presets: require.resolve('babel-preset-es2015'),
        plugins: require.resolve('babel-plugin-transform-runtime')
      }
    }, {
      test: /\.json$/,
      loader: 'json'
    }],
    postLoaders: [{
      test: /\.js$/,
      loader: 'transform?brfs'
    }]
  },
  node: {
    Buffer: true
  },
  externals: {
    net: '{}',
    fs: '{}',
    tls: '{}',
    console: '{}',
    'require-dir': '{}'
  }
};
