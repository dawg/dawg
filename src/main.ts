import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import middlware from '@/middleware';

Vue.config.productionTip = false;

middlware();

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');
