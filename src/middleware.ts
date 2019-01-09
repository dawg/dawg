import Vuetify from 'vuetify';
import Icon from 'vue-awesome/components/Icon.vue';
import Vue from 'vue';
// import VueShortkey from 'vue-shortkey';
import 'vuetify/dist/vuetify.css';
import 'vue-awesome/icons';
import '@/styles/global.sass';
import Ico from '@/components/Ico.vue';
import TooltipIcon from '@/components/TooltipIcon.vue';
import Theme from '@/modules/theme';
import Update from '@/modules/update';
import Context from '@/modules/context';
import VueLogger from 'vuejs-logger';
import Notification from '@/modules/notification';

const middleware = () => {
  Vue.use(Vuetify, {theme: false});
  Vue.use(Theme);
  Vue.use(Update);
  Vue.use(Context);
  Vue.component('icon', Icon);
  // Vue.use(VueShortkey);
  Vue.use(Notification);
  Vue.component('ico', Ico);
  Vue.component('TooltipIcon', TooltipIcon);
  Vue.use(VueLogger, {
    logLevel :  'info',
  });
};

export default middleware;
