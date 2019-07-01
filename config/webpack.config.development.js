const path = require("path");
const config = require("./webpack.config.base.js");
const merge = require("webpack-merge");

module.exports = merge.smart(config, {
    mode: "development",
    entry: {
        options: [
            "webpack-dev-server/client?http://localhost:8080",
            "webpack/hot/only-dev-server"
        ]
    },
    output: {
        devtoolModuleFilenameTemplate: "[absolute-resource-path]",
        devtoolFallbackModuleFilenameTemplate: "[absolute-resource-path]?[hash]"
    },
    devtool: "inline-source-map",
    devServer: {
        hot: true,
        contentBase: path.resolve(__dirname, "../dist"),
        port: 8080,
        host: "localhost",
        historyApiFallback: {
            index: "options.html"
        },
        publicPath: "/",
        disableHostCheck: true
    }
});
