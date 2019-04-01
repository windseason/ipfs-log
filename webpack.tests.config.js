'use strict'

const glob = require('glob')
const webpack = require('webpack')
const path = require('path')

module.exports = {
  // TODO: put all tests in a .js file that webpack can use as entry point
  entry: glob.sync('./test/*.spec.js', { 'ignore': ['./test/replicate.spec.js'] }),
  output: {
    filename: '../test/browser/bundle.js'
  },
  target: 'web',
  devtool: 'source-map',
  node: {
    console: false,
    process: 'mock',
    Buffer: true
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify(process.env.NODE_ENV)
      }
    })
  ],
  externals: {
    fs: '{}',
    rimraf: '{ sync: () => {} }',
    'idb-readable-stream': '{}'
  },
  resolve: {
    modules: [
      'node_modules',
      path.resolve(__dirname, '../node_modules')
    ]
  },
  resolveLoader: {
    modules: [
      'node_modules',
      path.resolve(__dirname, '../node_modules')
    ],
    moduleExtensions: ['-loader']
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { modules: false }]
            ],
            plugins: ['@babel/syntax-object-rest-spread', '@babel/transform-runtime', '@babel/plugin-transform-modules-commonjs']
          }
        }
      },
      // For inlining the fixture keys in browsers tests
      {
        test: /userA|userB|userC|userD|030f4141da9bb4bc8d9cc9a6a01cdf0e8bc0c0f90fd28646f93d0de4e93b723e31|038bef2231e64d5c7147bd4b8afb84abd4126ee8d8335e4b069ac0a65c7be711ce|0276b51c36dc6a117aef6f8ecaa49c27c309b29bbc97218e21cc0d7c903a21f376|0208290bc83e02be25a65be2e067e4d2ecc55ae88e0c073b5d48887d45e7e0e393$/,
        loader: 'json-loader'
      }
    ]
  }
}
