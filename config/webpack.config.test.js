const config = require("./webpack.config.base.js");
const merge = require("webpack-merge");

module.exports = merge.smart(config, {
    mode: "development",
    target: "node",
    module: {
        rules: [
            {
                test: /\.ts|tsx$/,
                enforce: "post",
                exclude: /node_modules|static/,
                loader: "istanbul-instrumenter-loader",
                options: {
                    esModules: true
                }
            }
        ]
    },
    output: {
        libraryTarget: "umd"
    }
});
