import Vue from 'vue';
import Sequencer from '@/modules/sequencer/Sequencer.vue';

const U = {
  install(vue: any) {
    Vue.component('Sequencer', Sequencer);
  },
};

export default U;
