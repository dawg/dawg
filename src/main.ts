import Vue from 'vue';
import middleware from '@/middleware';
import App from '@/lib/framework/App.vue';
import * as Sentry from '@sentry/browser';
import * as Integrations from '@sentry/integrations';

middleware();

Vue.config.productionTip = false;
Vue.config.devtools = process.env.NODE_ENV === 'development';

Sentry.init({
  dsn: 'https://49cb176e1e5c4728b16631baac74f002@o373147.ingest.sentry.io/5189007',
  integrations: [new Integrations.Vue({Vue, attachProps: true})],
});

new Vue({
  render: (h) => h(App),
}).$mount('#app');
