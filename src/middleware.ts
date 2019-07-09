import Vue from 'vue';
import storybook from '@/storybook';
import * as backup from '@/dawg/extensions/extra/backup';
import * as explorer from '@/dawg/extensions/extra/explorer';
import * as audioFiles from '@/dawg/extensions/extra/audio-files';
import * as clips from '@/dawg/extensions/extra/clips';
import * as mixer from '@/dawg/extensions/core/mixer';
import * as dawg from '@/dawg';

const middleware = () => {
  storybook();

  // This imports all .vue files in the components folder
  // See https://vuejs.org/v2/guide/components-registration.html
  const components = require.context(
    './components',
    // Whether or not to look in subfolders
    false,
    /\w+\.vue$/,
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

  // dawg.manager.activate(backup.extension);
  dawg.manager.activate(explorer.extension);
  dawg.manager.activate(audioFiles.extension);
  dawg.manager.activate(clips.extension);

  dawg.manager.activate(mixer.extension);
};

export default middleware;
