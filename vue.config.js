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
          Chrome_travis_ci: {
            base: 'Chrome',
            flags: ['--no-sandbox']
          }
        },
      }
    }
  }
}

if(process.env.GITHUB_ACTION) {
  config.pluginOptions.karma.karmaConfig.browsers = ['Chrome_travis_ci'];
}

module.exports = config;
