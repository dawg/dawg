import Vuetify from 'vuetify';
import Icon from 'vue-awesome/components/Icon.vue';
import Vue from 'vue';
import VueKonva from 'vue-konva';
import VueShortkey from 'vue-shortkey';
import 'vuetify/dist/vuetify.css';
import 'vue-awesome/icons';
import '@/styles/global.sass';
import Ico from '@/components/Ico.vue';
import Theme from '@/modules/theme';
import VueLogger from 'vuejs-logger';

const middleware = () => {
  Vue.use(Vuetify, {theme: false});
  Vue.use(Theme);
  Vue.component('icon', Icon);
  Vue.use(VueShortkey);
  Vue.use(VueKonva);
  Vue.component('ico', Ico);
  Vue.use(VueLogger, {
    logLevel :  'info',
  });
};

export default middleware;
