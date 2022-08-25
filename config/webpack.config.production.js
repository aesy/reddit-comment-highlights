const config = require("./webpack.config.base.js");
const { merge } = require("webpack-merge");
const ZipPlugin = require("zip-webpack-plugin");
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");

module.exports = merge(config, {
    mode: "production",
    optimization: {
        minimizer: [
            new TerserPlugin(),
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
        new ZipPlugin({
            filename: "app",
            extension: "zip"
        }),
        new ZipPlugin({
            filename: "app",
            extension: "xsi"
        }),
        new ZipPlugin({
            filename: "app",
            extension: "crx"
        })
    ]
});
