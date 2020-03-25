const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "Coronavirus Stats",
    }),
  ],
  module: {
    rules: [
     {
        test: /\.(csv|tsv)$/,
        use: [
          'csv-loader',
        ],
      },
    ]
  }
};

