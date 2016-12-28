const config = require('./webpack.config.base.js');
const merge = require('webpack-merge');

module.exports = merge.smart({
	devtool: 'inline-source-map'
}, config);
