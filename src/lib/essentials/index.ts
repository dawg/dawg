import Vue from 'vue';

const install = () => {
  // This imports all .vue files in the components folder
  const components = require.context(
    './',
    // Whether or not to look in subfolders
    false,
    /\w+\.vue/,
  );

  components.keys().forEach((fileName) => {
    // Get component config
    const componentConfig = components(fileName);

    // Get PascalCase name of component
    const componentName = fileName.slice(2, fileName.length - 4);

    // Register component globally
    Vue.component(
      componentName,
      // Look for the component options on `.default`, which will
      // exist if the component was exported with `export default`,
      // otherwise fall back to module's root.
      componentConfig.default || componentConfig,
    );
  });
};

export default {
  install,
};
