const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
	context: path.resolve(__dirname, '..'),
	entry: {
		backgroundScript: ['./src/js/backgroundScript.js'],
		contentScript: ['./src/js/contentScript.js'],
		options: ['./src/js/optionsPage.js']
	},
	output: {
		path: path.resolve(__dirname, '../dist/'),
		publicPath: './',
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
					presets: ['es2015'],
					plugins: [
						'transform-class-properties'
					]
				}
			}]
		}, {
			test: /\.(css|sass|scss)/,
			exclude: /node_modules/,
			use: ExtractTextPlugin.extract({
				fallback: 'style-loader',
				use: [{
					loader: 'css-loader',
					options: {
						minimize: true,
						sourceMap: false
					}
				}, {
					loader: 'sass-loader'
				}, {
					loader: 'postcss-loader',
					options: {
						plugins: (loader) => [
							require('autoprefixer')
						]
					}
				}]
			})
		}, {
			test: /\.(ico|gif|png|jpg)$/,
			exclude: /node_modules/,
			use: [{
				loader: 'file-loader',
				options: {
					limit: 100000,
					name: 'img/[name].[ext]'
				}
			}]
		}]
	},
	plugins: [
		new webpack.NoEmitOnErrorsPlugin(),
		new webpack.NamedModulesPlugin(),
		new HtmlWebpackPlugin({
			hash: false,
			template: 'src/options.html',
			filename: 'options.html',
			chunks: ['options'],
			minify: {
				collapseWhitespace: true,
				removeComments: true
			}
		}),
		new ExtractTextPlugin({
			filename: 'css/[name].css'
		}),
		new CopyWebpackPlugin([{
			context: 'src',
			from: '**/*.json'
		}, {
			context: 'src',
			from: 'img/*.*'
		}])
	],
	performance: {
		hints: false
	}
};
