const webpack = require('webpack')

module.exports = {
  entry: './src/log.js',
  output: {
    libraryTarget: 'var',
    library: 'Log',
    filename: './dist/ipfslog.min.js'
  },
  node: {
    console: false,
    process: 'mock',
    Buffer: true
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      mangle: false,
      compress: { warnings: false }
    })
  ],
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
    tls: '{}',
    'require-dir': '{}'
  }
}
