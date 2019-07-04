import Vue from 'vue';
import middleware from '@/middleware';
import App from '@/App.vue';
import store from '@/store';

middleware();

Vue.config.productionTip = false;

new Vue({
  store,
  render: (h) => h(App),
}).$mount('#app');
