import Vue from 'vue';
import Vuetify from 'vuetify';
import 'vue-awesome/icons';
import 'vuetify/dist/vuetify.css';
import Icon from 'vue-awesome/components/Icon.vue';
import VueLogger from 'vuejs-logger';
import Update from '@/modules/update';
import Theme from '@/modules/theme';
import sequencer from '@/modules/sequencer';
import Dawg from '@/modules/dawg';
import DragNDrop from '@/modules/dragndrop';
import '@/styles/global.sass';
import VuePerfectScrollbar from 'vue-perfect-scrollbar';
import Draggable from '@dawgjs/draggable';
import Knobs from '@/modules/knobs';
import Split from '@dawgjs/split/src/Split.vue';

import Piano from '@/components/Piano.vue';
import DTrack from '@/components/DTrack.vue';
import TooltipIcon from '@/components/TooltipIcon.vue';
import DotButton from '@/components/DotButton.vue';

export default function middleware() {
  Vue.use(Theme);
  Vue.use(Update);
  Vue.use(DragNDrop);
  Vue.use(Dawg);
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

  Vue.component('Draggable', Draggable);
  Vue.component('Split', Split);
}
