const config = {
  pluginOptions: {
    karma: {
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

if(process.env.TRAVIS) {
  config.pluginOptions.karma.karmaConfig.browsers = ['Chrome_travis_ci'];
}

module.exports = config;
