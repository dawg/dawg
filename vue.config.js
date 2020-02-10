process.env.CHROME_BIN = require('puppeteer').executablePath()

const config = {
  runtimeCompiler: true,
  pluginOptions: {
    karma: {
      // FIXME this may not work with the new karma plugin
      // See https://github.com/tushararora/vue-cli-plugin-unit-karmajs/issues/1
      // Include spec files in src/
      files: [
        'src/**/*.spec.ts',
        'src/**/*.spec.js',
      ],
      karmaConfig: {
        browsers: ['ChromeHeadless'],
      }
    }
  }
}

module.exports = config;
