import Vue from 'vue';
import * as dawg from '@/dawg';
import path from 'path';
import '@/styles/material.css';
import '@/styles/fontawesome/all.css';
import '@/main.css';
import Update from '@/modules/update';
import sequencer from '@/modules/sequencer';
import DragNDrop from '@/modules/dragndrop';
import Draggable from '@/modules/draggable';
import Knobs from '@/modules/knobs';
import Split from '@/modules/split';

const middleware = () => {
  // This imports all .vue files in the components folder
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

  const extensions = require.context(
    './dawg/extensions/extra',
    // Whether or not to look in subfolders
    true,
    /^.+\.ts$/,
  );

  extensions.keys().forEach((fileNameOrFolderName) => {
    // slice(1) to remove "."
    const parts = fileNameOrFolderName.split(path.sep).slice(1);

    let extensionModule: any;
    switch (parts.length) {
      case 0:
        return;
      case 1:
        extensionModule = extensions(fileNameOrFolderName);
        break;
      case 2:
        if (parts[1] === 'index.ts') {
          extensionModule = extensions(fileNameOrFolderName);
          break;
        } else {
          return;
        }
      default:
        return;
    }

    if (!extensionModule.extension) {
      // tslint:disable-next-line:no-console
      console.error(`${fileNameOrFolderName} does not export "extension"`);
      return;
    }

    dawg.manager.activate(extensionModule.extension);
  });

  Vue.use(Split);
  Vue.use(Update);
  Vue.use(DragNDrop);
  Vue.use(Knobs);
  Vue.use(sequencer);
  Vue.use(Draggable);
};

export default middleware;
