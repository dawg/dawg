import Vue from 'vue';
import * as backup from '@/dawg/extensions/extra/backup';
import * as explorer from '@/dawg/extensions/extra/explorer';
import * as time from '@/dawg/extensions/extra/time';
import * as bpm from '@/dawg/extensions/extra/bpm';
import * as audioFiles from '@/dawg/extensions/extra/audio-files';
import * as clips from '@/dawg/extensions/extra/clips';
import * as spectrogram from '@/dawg/extensions/extra/spectrogram';
import * as play from '@/dawg/extensions/extra/play';
import * as projectName from '@/dawg/extensions/extra/project-name';
import * as mixer from '@/dawg/extensions/core/mixer';
import * as models from '@/dawg/extensions/core/models';
import * as helpLinks from '@/dawg/extensions/extra/help-links';
import * as restorer from '@/dawg/extensions/extra/restorer';
import * as dawg from '@/dawg';


import '@/styles/material.css';
import '@/styles/fontawesome/all.css';
import '@/main.css';
import Update from '@/modules/update';
import sequencer from '@/modules/sequencer';
import DragNDrop from '@/modules/dragndrop';
import VuePerfectScrollbar from 'vue-perfect-scrollbar';
import { DragElement } from '@/modules/draggable';
import Knobs from '@/modules/knobs';
import Split from '@/modules/split';
// tslint:disable-next-line:no-var-requires
const VTooltip = require('v-tooltip');

const middleware = () => {
  Vue.use(VTooltip);

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
  [
    explorer,
    audioFiles,
    clips,
    mixer,
    models,
    time,
    bpm,
    projectName,
    spectrogram,
    backup,
    play,
    helpLinks,
    restorer,
  ].forEach(({ extension }) => {
    dawg.manager.activate(extension);
  });

  Vue.use(Split);
  Vue.use(Update);
  Vue.use(DragNDrop);
  Vue.use(Knobs);
  Vue.use(sequencer);
  Vue.component('VuePerfectScrollbar', VuePerfectScrollbar);
  Vue.component('DragElement', DragElement);
};

export default middleware;
