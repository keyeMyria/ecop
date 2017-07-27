var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
let extractCSS = new ExtractTextPlugin('[name].css');

// for babel-preset-react-app
process.env.BABEL_ENV = 'production';

module.exports = {
  entry: {
    main: './src/main.js'
  },

  output: {
    path: 'build',
    filename: '[name].js'
  },

  module: {
    preLoaders: [{
      test: /\.js$/,
      loader: 'eslint'
    }],

    loaders: [{
      test: /\.js$/,
      loader: 'babel',
      exclude: /node_modules/,
      query: {
        presets: ['es2015', 'react-app', 'stage-1'],
        plugins: ['transform-object-assign']
      }
    }, {
      test: /\.scss$/,
      loader: extractCSS.extract(['css!postcss!sass'])
    }, {
      test: /\.less$/,
      loader: extractCSS.extract(['css!postcss!less'])
    }, {
      test: /\.(ico|jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2)(\?.*)?$/,
      loader: 'file',
      query: {
        name: 'resources/[name].[hash:8].[ext]'
      }
    }]
  },

  eslint: {
    failOnWarning: false,
    failOnError: true
  },

  resolve: {
    root: [
      path.resolve('./src')
    ],
    alias: {
      images: path.resolve('./resources/images'),
      fonts: path.resolve('./resources/fonts')
    }
  },

  sassLoader: {
    includePaths: [path.resolve('./src/sass')]
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production')
      }
    }),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.DedupePlugin(),
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
    extractCSS
  ],

  postcss: [
    require('autoprefixer')
  ],

  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  }
};
