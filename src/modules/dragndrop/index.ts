import Vue from 'vue';
import { Drag, Drop } from 'vue-drag-drop';

export default {
  install() {
    Vue.component('drag', Drag);
    Vue.component('drop', Drop);
  },
};
