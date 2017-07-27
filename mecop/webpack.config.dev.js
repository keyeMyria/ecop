var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
let extractCSS = new ExtractTextPlugin('[name].css');

// for babel-preset-react-app
process.env.BABEL_ENV = 'development';

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
    extractCSS
  ],

  postcss: [
    require('autoprefixer')
  ],

  eslint: {
    failOnWarning: false,
    failOnError: true
  }
};