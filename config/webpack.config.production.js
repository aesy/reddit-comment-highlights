const webpack = require('webpack');
const config = require('./webpack.config.base.js');
const merge = require('webpack-merge');
const ArchivePlugin = require('webpack-archive-plugin');

module.exports = merge.smart({
	output: {
		filename: 'app.js'
	},
	plugins: [
		new webpack.DefinePlugin({
			'process.env': {
				'NODE_ENV': JSON.stringify('production')
			}
		}),
		new webpack.optimize.OccurenceOrderPlugin(true),
		new webpack.optimize.DedupePlugin(),
		new webpack.optimize.UglifyJsPlugin({
			compress: {
				warnings: false,
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
			output: 'package',
			format: 'zip'
		})
	]
}, config);
