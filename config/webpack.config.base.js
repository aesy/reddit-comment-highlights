const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
	context: path.join(__dirname, '..'),
	entry: {
		BackgroundScript: ['./src/js/BackgroundScript.js'],
		ContentScript: ['./src/js/ContentScript.js'],
		Options: ['./src/js/OptionsPage.js']
	},
	output: {
		path: 'dist',
		publicPath: '/',
		filename: 'js/[name].js',
		libraryTarget: 'window'
	},
	resolve: {
		extensions: ['.js', '.css', '.scss', '.sass']
	},
	module: {
		rules: [{
			test: /\.(js)$/,
			exclude: /node_modules/,
			use: [{
				loader: 'babel-loader',
				options: {
					presets: ['es2015', 'stage-0'],
					plugins: []
				}
			}]
		}, {
			test: /\.(css|sass|scss)/,
			exclude: /node_modules/,
			loader: ExtractTextPlugin.extract({
				fallbackLoader: 'style-loader',
				loader: [{
					loader: 'css-loader',
					query: { // will change to 'options' in the future?
						minimize: true,
						sourceMap: false
					}
				}, {
					loader: 'sass-loader'
				}]
			})
		}, {
			test: /\.(ico|gif|png|jpg)$/,
			exclude: /node_modules/,
			use: [{
				loader: 'url-loader',
				options: {
					limit: 100000,
					name: 'img/[name].[ext]'
				}
			}]
		}]
	},
	plugins: [
		new webpack.NoErrorsPlugin(),
		new webpack.NamedModulesPlugin(),
		new HtmlWebpackPlugin({
			hash: false,
			template: 'src/Options.html',
			filename: 'Options.html',
			chunks: ['Options']
		}),
		new ExtractTextPlugin({
			filename: 'css/[name].css',
			allChunks: true
		}),
		new CopyWebpackPlugin([{
			context: 'src',
			from: '**/*.json'
		}, {
			context: 'src',
			from: 'img/icon*.*'
		}])
	],
	performance: {
		hints: false
	}
};
