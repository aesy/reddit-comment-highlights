const config = require("./webpack.config.base.js");
const merge = require("webpack-merge");
const ArchivePlugin = require("webpack-archive-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");

module.exports = merge.smart(config, {
    mode: "production",
    optimization: {
        minimizer: [
            new UglifyJsPlugin({
                sourceMap: false,
                uglifyOptions: {
                    compress: {
                        drop_console: false
                    }
                }
            }),
            new OptimizeCSSAssetsPlugin({
                cssProcessorPluginOptions: {
                    preset: [
                        "default",
                        {
                            discardComments: {
                                removeAll: true
                            }
                        }
                    ]
                }
            })
        ]
    },
    plugins: [
        new ArchivePlugin({
            output: "dist/app",
            format: "zip"
        }),
        new ArchivePlugin({
            output: "dist/app",
            format: "zip",
            ext: "xsi"
        }),
        new ArchivePlugin({
            output: "dist/app",
            format: "zip",
            ext: "crx"
        })
    ]
});
