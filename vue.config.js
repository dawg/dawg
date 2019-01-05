module.exports = {
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
        browsers: ['Chrome']
      }
    }
  }
}