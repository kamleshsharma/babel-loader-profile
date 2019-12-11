const babelLoader = require("babel-loader");
const wrapper = require("./wrapper");

module.export = babelLoader.custom(wrapper);
