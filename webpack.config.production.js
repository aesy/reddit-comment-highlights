const config = require("./webpack.config.base.js");
const { merge } = require("webpack-merge");
const ZipPlugin = require("zip-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');

let target = process.env.BROWSER_TARGET;

if (!target) {
  throw new Error("Missing required environment variable 'BROWSER_TARGET'");
}

if (!['firefox', 'chrome'].includes(target)) {
  throw new Error(`Unsupported browser: ${ target }`);
}

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
                                removeAll: true,
                            },
                        },
                    ],
                },
            }),
        ],
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                {
                    context: "public",
                    from: `manifest.${target}.json`,
                    to: "manifest.json",
                },
            ],
        }),
        new ZipPlugin({
            filename: target === "chrome" ? "app.chrome" : "app.firefox",
        }),
    ],
});
