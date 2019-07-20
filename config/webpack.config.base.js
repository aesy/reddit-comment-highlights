const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const Autoprefixer = require("autoprefixer");

module.exports = {
    context: path.resolve(__dirname, ".."),
    entry: {
        backgroundScript: [ "./src/background/BackgroundScript.ts" ],
        contentScript: [ "./src/content/ContentScript.ts" ],
        options: [ "./src/options/OptionsPage.ts" ]
    },
    target: "web",
    output: {
        path: path.resolve(__dirname, "..", "dist"),
        publicPath: "/",
        filename: "js/[name].js",
        libraryTarget: "window"
    },
    resolve: {
        extensions: [ ".js", ".ts" ],
        modules: [
            "src",
            "node_modules"
        ]
    },
    module: {
        rules: [
            {
                test: /\.ts|tsx$/,
                exclude: /node_modules|static/,
                use: [
                    {
                        loader: "babel-loader",
                        options: {
                            presets: [
                                [
                                    "@babel/preset-env",
                                    {
                                        useBuiltIns: "usage",
                                        corejs: "3.0.0"
                                    }
                                ],
                                "@babel/typescript"
                            ],
                            plugins: [
                                [ "@babel/plugin-proposal-decorators", { "legacy": true } ],
                                [ "@babel/proposal-class-properties", { "loose": true } ],
                                [ "@babel/proposal-object-rest-spread" ]
                            ]
                        }
                    }
                ]
            },
            {
                test: /\.css|sass|scss/,
                exclude: /node_modules/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: "css-loader",
                        options: {
                            sourceMap: true
                        }
                    },
                    {
                        loader: "postcss-loader",
                        options: {
                            sourceMap: true,
                            plugins: () => [ Autoprefixer ]
                        }
                    },
                    {
                        loader: "resolve-url-loader"
                    },
                    {
                        loader: "sass-loader",
                        options: {
                            sourceMap: true
                        }
                    }
                ]
            },
            {
                test: /\.ico|gif|png|jpe?g|svg$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "file-loader",
                        options: {
                            limit: 10000,
                            name: "img/[name].[ext]"
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            hash: false,
            template: "static/options.html",
            filename: "options.html",
            chunks: [ "options" ],
            minaify: {
                collapseWhitespace: true,
                removeComments: true
            }
        }),
        new MiniCssExtractPlugin({
            filename: "css/[name].css"
        }),
        new CopyWebpackPlugin([
            {
                context: "static",
                from: "**/*.json"
            },
            {
                context: "static",
                from: "img/*.*"
            }
        ])
    ],
    optimization: {
        noEmitOnErrors: true
    },
    performance: {
        hints: false
    },
    stats: {
        errorDetails: true
    },
    node: {
        fs: "empty"
    }
};
