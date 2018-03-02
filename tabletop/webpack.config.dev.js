var path = require('path')
var ExtractTextPlugin = require('extract-text-webpack-plugin')

const extractSass = new ExtractTextPlugin({
  filename: '[name].css'
})

process.env.BABEL_ENV = 'development';

module.exports = {
  entry: {
    app: './main.js'
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
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: [['es2015', { modules: false }], 'react', 'stage-1'],
          plugins: ['transform-object-assign']
        }
      },
      {
        test: /\.scss$/,
        use: extractSass.extract({
          use: [
            {
              loader: 'css-loader'
            },
            {
              loader: 'postcss-loader',
              options: {
                plugins: loader => [require('autoprefixer')()]
              }
            },
            {
              loader: 'sass-loader',
              options: {
                includePaths: [path.resolve('./sass')]
              }
            }
          ]
        })
      }
    ]
  },
  plugins: [extractSass]
}
