const CopyPlugin = require('copy-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const path = require('path');
const webpack = require('webpack')

module.exports = (env, argv) => {
  // ビルドモードに基づいて、読み込む .env ファイルを決定
  const envPath = argv.mode === 'development' ? '.env.development' : '.env';

  return {
    entry: './src/index.ts', // 入力となるTypeScriptファイル
    module: {
      rules: [
        {
          test: /\.tsx?$/, // TypeScriptファイルを対象とする
          use: 'ts-loader', // ts-loaderを使用する
          exclude: /node_modules/ // node_modulesディレクトリは除外する
        },
        {
          test: /\.css$/, // CSSファイルを対象にする
          use: [
            'style-loader', // CSSをHTMLのstyleタグに挿入する
            'css-loader' // CSSをモジュールとしてインポートする
          ]
        }
      ]
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'] // 解決する拡張子
    },
    output: {
      filename: 'rubyful.js', // 出力となるファイル名
      path: path.resolve(__dirname, 'dist') // 出力先のディレクトリ
    },
    target: ['web', 'browserslist:>0.25%, not dead'], // ターゲットの設定
    plugins: [
      // fix "process is not defined" error:
      new webpack.ProvidePlugin({
        process: 'process/browser',
      }),
      new CopyPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, 'node_modules', 'kuromoji/dict'),
            to: path.resolve(__dirname, 'dist/dict'),
          },
        ],
      }),
      new Dotenv({
        path: envPath, // 修正されたenvPathを使用
      })
    ]
  }
};