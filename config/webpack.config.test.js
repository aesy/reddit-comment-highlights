const config = require("./webpack.config.base.js");
const merge = require("webpack-merge");

module.exports = merge.smart(config, {
    mode: "development",
    target: "node",
    output: {
        libraryTarget: "umd"
    }
});
