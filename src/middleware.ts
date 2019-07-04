import Vue from 'vue';
import { remote } from 'electron';
import Context from '@/modules/context';
import storybook from '@/storybook';
import * as backup from '@/dawg/extensions/extra/backup';
import * as record from '@/dawg/extensions/extra/record';
import * as explorer from '@/dawg/extensions/extra/explorer';
import * as clips from '@/dawg/extensions/extra/clips';
import * as patterns from '@/dawg/extensions/extra/patterns';
import * as dawg from '@/dawg';
import { plugin } from 'vue-function-api';

const inspect = {
  text: 'Inspect',
  callback: (e: MouseEvent) => {
    // Wait for context menu to close before opening the Dev Tools!
    // If you don't, it will focus on the context menu.
    setTimeout(() => {
      const window = remote.getCurrentWindow();
      window.webContents.inspectElement(e.x, e.y);
      if (window.webContents.isDevToolsOpened()) {
        window.webContents.devToolsWebContents.focus();
      }
    }, 1000);
  },
};

const middleware = () => {
  Vue.use(plugin);

  Vue.use(Context, {
    // Only have inspect in development
    default: process.env.NODE_ENV !== 'production' ? [inspect] : [],
  });

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
  dawg.manager.activate(record.extension);
  dawg.manager.activate(explorer.extension);
  dawg.manager.activate(clips.extension);
  dawg.manager.activate(patterns.extension);
};

export default middleware;
