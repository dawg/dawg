import Vue from 'vue';
import CompositionAPI from '@vue/composition-api';
// import * as dawg from '@/dawg';
// import path from 'path';
// import '@/styles/material.css';
// import '@/styles/fontawesome/all.css';
// import '@/styles/main.css';
// import DragNDrop from '@/lib/dragndrop';
// import Split from '@/lib/split';
// import Essentials from '@/lib/essentials';
// import { getLogger } from '@/lib/log';

// const logger = getLogger('middleware');

const middleware = () => {
  Vue.use(CompositionAPI);
  // // This imports all .vue files in the components folder
  // const components = require.context(
  //   './components',
  //   // Whether or not to look in subfolders
  //   false,
  //   /\w+\.vue/,
  // );

  // components.keys().forEach((fileName) => {
  //   // Get component config
  //   const componentConfig = components(fileName);

  //   // Get PascalCase name of component
  //   const componentName = fileName.slice(2, fileName.length - 4);

  //   // Register component globally
  //   Vue.component(
  //     componentName,
  //     // Look for the component options on `.default`, which will
  //     // exist if the component was exported with `export default`,
  //     // otherwise fall back to module's root.
  //     componentConfig.default || componentConfig,
  //   );
  // });

  // const extensions = require.context(
  //   './extra',
  //   // Whether or not to look in subfolders
  //   true,
  //   /^.+\.ts/,
  // );

  // extensions.keys().forEach((fileNameOrFolderName) => {
  //   // slice(1) to remove "."
  //   // OK so I initially used path.sep to split the path *but* it wasn't working on windows
  //   // IDK why but on windows "/" is still used as the seperator
  //   const parts = fileNameOrFolderName.split('/').slice(1);

  //   let extensionModule: any;
  //   switch (parts.length) {
  //     case 0:
  //       return;
  //     case 1:
  //       extensionModule = extensions(fileNameOrFolderName);
  //       break;
  //     case 2:
  //       if (parts[1] === 'index.ts') {
  //         extensionModule = extensions(fileNameOrFolderName);
  //         break;
  //       } else {
  //         return;
  //       }
  //     default:
  //       return;
  //   }

  //   if (!extensionModule.extension) {
  //     logger.error(`${fileNameOrFolderName} does not export "extension"`);
  //     return;
  //   }

  //   dawg.manager.activate(extensionModule.extension);
  // });

  // Vue.use(Split);
  // Vue.use(DragNDrop);
  // Vue.use(Essentials);
};

export default middleware;
