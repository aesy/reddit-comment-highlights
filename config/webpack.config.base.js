const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const Autoprefixer = require('autoprefixer');

module.exports = {
	context: path.resolve(__dirname, '..'),
	entry: {
		backgroundScript: ['./src/js/backgroundScript.js'],
		contentScript: ['./src/js/contentScript.js'],
		options: ['./src/js/optionsPage.js']
	},
	target: 'web',
	output: {
		path: path.resolve(__dirname, '../dist/'),
		publicPath: '/',
		filename: 'js/[name].js',
		libraryTarget: 'window'
	},
	module: {
		rules: [{
			test: /\.js|jsx$/,
			exclude: /node_modules/,
			use: [{
				loader: 'babel-loader',
				options: {
					presets: [
						[
							'@babel/preset-env',
							{
								useBuiltIns: 'usage',
								corejs: '3.0.0'
							}
						]
					],
					plugins: [
						'transform-class-properties'
					]
				}
			}]
		}, {
			test: /\.css|sass|scss/,
			exclude: /node_modules/,
			use: [
				MiniCssExtractPlugin.loader,
				{
					loader: 'css-loader',
					options: {
						sourceMap: true
					}
				}, {
					loader: 'postcss-loader',
					options: {
						sourceMap: true,
						plugins: (loader) => [
							Autoprefixer
						]
					}
				}, {
					loader: 'resolve-url-loader'
				}, {
					loader: 'sass-loader',
					options: {
						sourceMap: true
					}
				}
			]
		}, {
			test: /\.ico|gif|png|jpe?g|svg$/,
			exclude: /node_modules/,
			use: [{
				loader: 'file-loader',
				options: {
					limit: 10000,
					name: 'img/[name].[ext]'
				}
			}]
		}]
	},
	plugins: [
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
		new MiniCssExtractPlugin({
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
	optimization: {
		noEmitOnErrors: true
	},
	performance: {
		hints: false
	},
	stats: {
		errorDetails: true
	}
};
