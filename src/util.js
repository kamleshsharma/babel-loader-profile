const constant = require("./constant");

function printResult(data) {
    console.log("\x1b[33m%s\x1b[0m", "Babel-loader-profiler", data);
}

function trackLogToWebpackCompilation(store) {
  /**
   * scope of this function should be webpack compilation instance
   *
   * Creating log entry
   * here we can tap to the compilation life cycle.
   */
  let logEntries = this._compilation.logging.get(constant.LOADER_NAME);
  if (logEntries === undefined) {
    logEntries = [];
    this._compilation.logging.set(constant.LOADER_NAME, logEntries);
  }

  for (let key in store) {
    logEntries.push({
      time: Date.now(),
      type: "info",
      args: [key + " took  : ", store[key], "ms"]
    });
  }
  this._compilation.logging.set(constant.LOADER_NAME, logEntries);
}

module.exports = {
  printResult,
  trackLogToWebpackCompilation
};
