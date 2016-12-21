const webpack = require('webpack');
const path = require('path');
const autoprefixer = require('autoprefixer');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
	context: path.join(__dirname, '..'),
	entry: {
		background: ['./src/js/background.js'],
		content_script: ['./src/js/content_script.js'],
		options: ['./src/js/options_page.js']
	},
	output: {
		path: 'dist',
		publicPath: '/',
		pathInfo: true,
		filename: 'js/[name].js',
		libraryTarget: 'window'
	},
	resolve: {
		extensions: ['', '.js', '.json', '.css', '.scss', '.sass']
	},
	module: {
		loaders: [{
			test: /\.(js)$/,
			exclude: /node_modules/,
			loader: 'babel',
			query: {
				presets: ['es2015', 'stage-0'],
				plugins: [
					'transform-decorators-legacy'
				]
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
			template: 'src/options.html',
			filename: 'options.html',
			chunks: ['vendor', 'options']
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
