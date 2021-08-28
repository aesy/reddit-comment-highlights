const config = require("./webpack.config.base.js");
const { merge } = require("webpack-merge");

module.exports = merge(config, {
    mode: "development",
    output: {
        devtoolModuleFilenameTemplate: "[absolute-resource-path]",
        devtoolFallbackModuleFilenameTemplate: "[absolute-resource-path]?[hash]"
    },
    devtool: "inline-source-map"
});
