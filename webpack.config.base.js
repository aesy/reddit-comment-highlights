const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const Autoprefixer = require("autoprefixer");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

module.exports = {
    context: path.resolve(__dirname),
    entry: {
        backgroundScript: ["./src/background/index.ts"],
        contentScript: ["./src/content/index.ts"],
        options: ["./src/options/OptionsPage.ts"],
    },
    target: "web",
    output: {
        path: path.resolve(__dirname, "dist"),
        publicPath: "/",
        filename: "[name].js",
        globalObject: "this",
    },
    resolve: {
        extensions: [".js", ".ts"],
        modules: ["src", "node_modules"],
        plugins: [new TsconfigPathsPlugin({})],
    },
    module: {
        rules: [
            {
                test: /\.ts|tsx$/,
                exclude: /node_modules|dist/,
                use: [
                    {
                        loader: "babel-loader",
                        options: {
                            presets: [
                                [
                                    "@babel/preset-env",
                                    {
                                        useBuiltIns: "usage",
                                        corejs: "3.0.0",
                                    },
                                ],
                                "@babel/typescript",
                            ],
                            plugins: [
                                [
                                    "@babel/plugin-proposal-decorators",
                                    { legacy: true },
                                ],
                            ],
                        },
                    },
                ],
            },
            {
                test: /\.css|sass|scss/,
                exclude: /node_modules/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: "css-loader",
                        options: {
                            sourceMap: true,
                        },
                    },
                    {
                        loader: "postcss-loader",
                        options: {
                            sourceMap: true,
                            postcssOptions: {
                                plugins: [Autoprefixer],
                            },
                        },
                    },
                    {
                        loader: "sass-loader",
                        options: {
                            sourceMap: true,
                        },
                    },
                ],
            },
            {
                test: /\.ico|gif|png|jpe?g|svg$/,
                type: "asset/resource",
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            hash: false,
            template: "src/options.html",
            filename: "options.html",
            inject: "body",
            chunks: ["options"],
            minify: {
                collapseWhitespace: true,
                removeComments: true,
            },
        }),
        new MiniCssExtractPlugin({
            filename: "[name].css",
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    context: "public/icons",
                    from: "*.*",
                },
            ],
        }),
        new ForkTsCheckerWebpackPlugin({
            typescript: {
                configFile: "tsconfig.json",
            },
        }),
    ],
};
