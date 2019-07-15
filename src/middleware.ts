import Vue from 'vue';
import * as backup from '@/dawg/extensions/extra/backup';
import * as explorer from '@/dawg/extensions/extra/explorer';
import * as time from '@/dawg/extensions/extra/time';
import * as bpm from '@/dawg/extensions/extra/bpm';
import * as audioFiles from '@/dawg/extensions/extra/audio-files';
import * as clips from '@/dawg/extensions/extra/clips';
import * as spectrogram from '@/dawg/extensions/extra/spectrogram';
import * as projectName from '@/dawg/extensions/extra/project-name';
import * as mixer from '@/dawg/extensions/core/mixer';
import * as dawg from '@/dawg';

import Vuetify from 'vuetify';
import 'vue-awesome/icons';
import 'vuetify/dist/vuetify.css';
import '@/styles/material.css';
import Icon from 'vue-awesome/components/Icon.vue';
import VueLogger from 'vuejs-logger';
import Update from '@/modules/update';
import sequencer from '@/modules/sequencer';
import DragNDrop from '@/modules/dragndrop';
import VuePerfectScrollbar from 'vue-perfect-scrollbar';
import { DragElement } from '@/modules/draggable';
import Knobs from '@/modules/knobs';
import Split from '@/modules/split';

import Piano from '@/components/Piano.vue';
import DTrack from '@/components/DTrack.vue';
import TooltipIcon from '@/components/TooltipIcon.vue';
import DotButton from '@/components/DotButton.vue';

// TODO(jacob)
// const ChunkGhost = GH; // positionable(GH);

const middleware = () => {
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
    time,
    bpm,
    projectName,
    spectrogram,
    backup,
  ].forEach(({ extension }) => {
    dawg.manager.activate(extension);
  });

  Vue.use(Split);
  Vue.use(Update);
  Vue.use(DragNDrop);
  Vue.use(Knobs);
  Vue.use(VueLogger, {
    logLevel: 'info',
  });
  Vue.use(sequencer);
  Vue.component('VuePerfectScrollbar', VuePerfectScrollbar);

  Vue.use(Vuetify, {theme: false});
  Vue.component('icon', Icon);

  // TODO Move these to the dawg module
  Vue.component('Piano', Piano);
  Vue.component('DTrack', DTrack);
  Vue.component('DotButton', DotButton);
  Vue.component('TooltipIcon', TooltipIcon);

  Vue.component('DragElement', DragElement);
};

export default middleware;
