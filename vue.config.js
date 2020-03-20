process.env.CHROME_BIN = require('puppeteer').executablePath()

const config = {
  runtimeCompiler: true,
  pluginOptions: {
    karma: {
      files: ['src/**/*.spec.ts', 'src/assets/*'],
      karmaConfig: {
        browsers: ['ChromeHeadless'],
      }
    }
  }
}

module.exports = config;
