import Vue from 'vue';
import App from '@/App.vue';
import store from '@/store';
import middleware from '@/middleware';

Vue.config.productionTip = false;

middleware();

new Vue({
  store,
  render: (h) => h(App),
}).$mount('#app');
