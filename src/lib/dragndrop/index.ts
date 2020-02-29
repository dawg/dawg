import Drag from '@/lib/dragndrop/Drag.vue';
import Drop from '@/lib/dragndrop/Drop.vue';
import Vue from 'vue';

export default {
  install() {
    Vue.component('Drag', Drag);
    Vue.component('drop', Drop);
  },
};
