import Vue from 'vue';
// import Vue from 'vue';
import { plugin } from 'vue-function-api';
Vue.use(plugin);

import middleware from '@/middleware';
import App from '@/App.vue';

console.log('HELLO');

middleware();

Vue.config.productionTip = false;

new Vue({
  render: (h) => h(App),
}).$mount('#app');
