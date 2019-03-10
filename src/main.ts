import Vue from 'vue';
import firebase from 'firebase/app';
import 'firebase/database';
import App from '@/App.vue';
import middleware from '@/middleware';
import store from '@/store';

const config = {
  apiKey: 'AIzaSyCg8BcL3EbQpOpXFLwMx4h6XmdKtStVKhU',
  authDomain: 'dawg-backup.firebaseapp.com',
  databaseURL: 'https://dawg-backup.firebaseio.com',
  projectId: 'dawg-backup',
  storageBucket: 'dawg-backup.appspot.com',
  messagingSenderId: '540203128797',
};
firebase.initializeApp(config);

middleware();

Vue.config.productionTip = false;

new Vue({
  store,
  render: (h) => h(App),
}).$mount('#app');
