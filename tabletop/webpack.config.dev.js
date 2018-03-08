var path = require('path')

process.env.BABEL_ENV = 'development'

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
        exclude: /node_modules/,
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

  plugins: []
}
