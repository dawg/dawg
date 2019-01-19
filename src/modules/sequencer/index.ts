import Vue from 'vue';
import Sequencer from './Sequencer.vue';

interface Options {
  default?: number;
}

const U = {
  install(vue: any, options: Options = {}) {
    Vue.component('Sequencer', Sequencer);
  },
};

export default U;
