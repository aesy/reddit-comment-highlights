const webpack = require('webpack');
const config = require('./webpack.config.base.js');
const merge = require('webpack-merge');
const ArchivePlugin = require('webpack-archive-plugin');

module.exports = merge.smart({
	output: {
		filename: 'app.js'
	},
	plugins: [
		new webpack.optimize.UglifyJsPlugin({
			compress: {
				warnings: false,
				/* eslint camelcase:0 */
				drop_console: true
			},
			comments: false,
			sourceMap: false,
			mangle: {
				except: [
					'Array', 'BigInteger', 'Boolean', 'Buffer',
					'webpackJsonp', 'exports', 'require'
				]
			},
			minimize: true
		}),
		new ArchivePlugin({
			output: 'dist/app',
			format: 'zip'
		}),
		new ArchivePlugin({
			output: 'dist/app',
			format: 'zip',
			ext: 'crx'
		})
	]
}, config);
