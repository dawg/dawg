import Vue from 'vue';
import middleware from '@/middleware';
import App from '@/App.vue';
import Vuetify from 'vuetify';

middleware();

Vue.config.productionTip = false;

new Vue({
  render: (h) => h(App),
  vuetify: new Vuetify({ theme: { disable: true } }),
}).$mount('#app');
