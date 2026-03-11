const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

// 环境配置
const ENV = process.env.NODE_ENV || 'development';
const envPath = path.resolve(__dirname, `.env.${ENV}`);

// 加载环境变量
require('dotenv').config({ path: envPath });

module.exports = {
  entry: './src/standalone/campaign/index.js',
  mode: ENV === 'production' ? 'production' : 'development',
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist-standalone'),
    },
    host: '0.0.0.0',
    port: 3003,
    hot: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  output: {
    path: path.resolve(__dirname, 'dist-standalone/campaign'),
    publicPath: ENV === 'production'
      ? 'https://h5.example.com/campaign/'
      : 'http://localhost:3003/',
    clean: true,
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/standalone.html',
    }),
  ],
  // 独立页面优化：代码分割
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
        },
        common: {
          name: 'common',
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },
  },
};
