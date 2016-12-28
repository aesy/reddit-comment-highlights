const webpack = require('webpack');
const path = require('path');
const autoprefixer = require('autoprefixer');
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
		pathInfo: true,
		filename: 'js/[name].js',
		libraryTarget: 'window'
	},
	resolve: {
		extensions: ['', '.js', '.css', '.scss', '.sass']
	},
	module: {
		loaders: [{
			test: /\.(js)$/,
			exclude: /node_modules/,
			loader: 'babel',
			query: {
				presets: ['es2015', 'stage-0'],
				plugins: []
			}
		}, {
			test: /\.(css|sass|scss)/,
			exclude: /node_modules/,
			loader: ExtractTextPlugin.extract('style', 'css!postcss!sass')
		}, {
			test: /\.(ico|gif|png|jpg)$/,
			exclude: /node_modules/,
			loader: 'file',
			query: {
				limit: 100000,
				name: 'img/[name].[ext]'
			}
		}, {
			test: /\.(svg)$/,
			exclude: /node_modules/,
			loader: 'file',
			query: {
				limit: 100000,
				name: 'img/[name].[ext]'
			}
		}, {
			test: /\.(eot|ttf|woff)$/,
			exclude: /node_modules/,
			loader: 'file',
			query: {
				name: 'fonts/[name].[ext]'
			}
		}]
	},
	postcss: [ autoprefixer ],
	plugins: [
		new webpack.NoErrorsPlugin(),
		new webpack.NamedModulesPlugin(),
		new HtmlWebpackPlugin({
			hash: false,
			template: 'src/Options.html',
			filename: 'Options.html',
			chunks: ['Options']
		}),
		new ExtractTextPlugin('css/[name].css', {
			allChunks: true
		}),
		new CopyWebpackPlugin([{
			context: 'src',
			from: '**/*.json'
		}, {
			context: 'src',
			from: 'img/icon*.*'
		}])
	]
};
