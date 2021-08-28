const config = require("./webpack.config.base.js");
const { merge } = require("webpack-merge");

module.exports = merge(config, {
    mode: "development",
    devtool: "inline-source-map",
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
    },
    externals: {
        // https://github.com/jsdom/jsdom/issues/2508
        canvas: "commonjs canvas"
    }
});
