var path = require('path')
var webpack = require('webpack')
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin

// for babel-preset-react-app
process.env.BABEL_ENV = 'production'

module.exports = {
  entry: {
    app: './src/main.js'
  },

  output: {
    path: path.join(__dirname, 'build'),
    filename: '[name].js'
  },

  devtool: 'source-map',

  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'eslint-loader',
        options: {
          failOnError: true
        }
      },
      {
        test: /\.js$/,
        exclude: /node_modules\/(?!(jslib)\/).*/,
        loader: 'babel-loader',
        query: {
          presets: [['es2015', { modules: false }], 'react', 'stage-1'],
          plugins: ['transform-object-assign']
        }
      }
    ]
  },

  resolve: {
    modules: [path.resolve('./src'), 'node_modules']
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    }),

    // do not include validatorjs language files
    new webpack.IgnorePlugin(/^\.\/(?!en)(.+)$/, /validatorjs\/src\/lang/),

    new webpack.optimize.UglifyJsPlugin({
      compress: {
        screw_ie8: true, // React doesn't support IE8
        warnings: false
      },
      mangle: {
        screw_ie8: true
      },
      output: {
        comments: false,
        screw_ie8: true
      }
    }),

    // enable this when we need to analyze module size
    new BundleAnalyzerPlugin()
  ]
}
