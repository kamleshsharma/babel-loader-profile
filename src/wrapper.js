const { trackLogToWebpackCompilation } = require("./util");
const constant = require("./constant");

const store = {
  filesProcessedFromNodeModules: [],
  overallLoadTime: 0
};

const getTimer = key => startMilliseconds => {
  const diff = Date.now() - startMilliseconds;
  store[key] = store[key] ? parseInt(store[key]) + diff : diff;
};

function getBabelPluginWrapper(babel, plugin) {
  let start, end;
  let key =
    typeof plugin === "object" ? plugin.file.request : plugin.constructor.name;
  const updateTime = getTimer(key);
  if (typeof plugin === "object") {
    const pluginCopy = { ...plugin };
    let { value, options } = pluginCopy;
    options = { ...options };
    if (typeof value === "function") {
      // const value = function(api) {
      //   return new Proxy(pluginCopy.value(api, options), {
      //     get(obj, propKey) {
      //       if (propKey === "pre") {
      //         store[name] = {
      //           ...store[name],
      //           start: 0
      //         };
      //       } else if (propKey === "post") {
      //         store[name] = {
      //           ...store[name],
      //           stop: 0
      //         };
      //       }
      //       return obj[propKey];
      //     }
      //   });
      // };
      // return babel.createConfigItem([value, options]);
      const plug = function({ types: t }) {
        return {
          inherits: pluginCopy.value,
          pre(state) {
            start = Date.now();
          },
          post(state) {
            updateTime(start);
          }
        };
      };
      return babel.createConfigItem([plug, options, pluginCopy.file.request]);
    }
  }
  return plugin;
}

module.exports = function(babel) {
  let loaderStarts = 0;
  let tapedToCompilation = false;
  const updateTime = getTimer("overallLoadTime");
  return {
    customOptions({ ...loader }) {
      return {
        // Pull out any custom options that the loader might have.
        custom: {},
        // Pass the options back with the two custom options removed.
        loader
      };
    },

    // Passed Babel's 'PartialConfig' object.
    config(cfg) {
      loaderStarts = Date.now();
      if (cfg.hasFilesystemConfig()) {
        const con = {
          ...cfg.options,
          plugins: cfg.options.plugins.map(
            getBabelPluginWrapper.bind(this, babel)
          )
        };

        return con;
      }

      const buildcfg = {
        ...cfg.options,
        plugins: cfg.options.plugins.map(
          getBabelPluginWrapper.bind(this, babel)
        )
          ? cfg.options.plugins
          : []
      };

      return buildcfg;
    },

    result(result) {
      if (!tapedToCompilation) {
        tapedToCompilation = true;
        this._compiler.hooks.done.tap(constant.LOADER_NAME, stats => {
          trackLogToWebpackCompilation.call(this, store, stats);
        });
      }

      if (
        this.remainingRequest &&
        constant.EXCLUDE_REGX.filter(regx => this.remainingRequest.match(regx)).length
      ) {
        store.filesProcessedFromNodeModules.push(this.remainingRequest);
        store.totalFilesProcessedFromNodeModules =
          store.filesProcessedFromNodeModules.length;
      }
      updateTime(loaderStarts);
      return result;
    }
  };
};
