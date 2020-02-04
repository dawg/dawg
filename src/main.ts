import Vue from 'vue';
import middleware from '@/middleware';
import App from '@/framework/App.vue';

middleware();

Vue.config.productionTip = false;
Vue.config.devtools = process.env.NODE_ENV === 'development';

new Vue({
  render: (h) => h(App),
}).$mount('#app');
