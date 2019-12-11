const babelLoader = require("babel-loader");
const wrapper = require("./wrapper");

module.exports = babelLoader.custom(wrapper);
