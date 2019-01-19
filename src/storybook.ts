import Vue from 'vue';
import VueLogger from 'vuejs-logger';
import Update from '@/modules/update';
import Theme from '@/modules/theme';

export default function middleware() {
  Vue.use(Theme);
  Vue.use(Update);
  Vue.use(VueLogger, {
    logLevel :  'info',
  });
}
