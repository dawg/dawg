const config = {
  runtimeCompiler: true,
  pluginOptions: {
    karma: {
      // FIXME this may not work with the new karma plugin
      // See https://github.com/tushararora/vue-cli-plugin-unit-karmajs/issues/1
      // Include spec files in src/
      files: [
        'tests/**/*.spec.js',
        'tests/**/*.spec.ts',
        'src/**/*.spec.ts',
        'src/**/*.spec.js',
      ],
      karmaConfig: {
        browsers: ['Chrome'],
        customLaunchers: {
          HeadlessChrome: {
            base: 'Chrome',
            flags: ['--no-sandbox', '--disable-gpu', '--headless']
          }
        },
      }
    }
  }
}

if(process.env.GITHUB_ACTION) {
  console.log('[vue.config.js] In GitHub Actions. Setting browser to HeadlessChrome')
  config.pluginOptions.karma.karmaConfig.browsers = ['HeadlessChrome'];
}

module.exports = config;
