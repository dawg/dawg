import Vuetify from 'vuetify';
import Icon from 'vue-awesome/components/Icon.vue';
import Vue from 'vue';
import VueKonva from 'vue-konva';
import VueShortkey from 'vue-shortkey';
import 'vuetify/dist/vuetify.css';
import 'vue-awesome/icons';

const middleware = () => {
  Vue.use(Vuetify);
  Vue.component('icon', Icon);
  Vue.use(VueShortkey);
  Vue.use(VueKonva);
};

export default middleware;
