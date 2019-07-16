import Vue from 'vue';
import middleware from '@/middleware';
import App from '@/App.vue';

middleware();

Vue.config.productionTip = false;

new Vue({
  render: (h) => h(App),
}).$mount('#app');
