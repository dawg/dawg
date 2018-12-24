import Vue from 'vue';
import Vuex from 'vuex';
import { Project } from './models';

Vue.use(Vuex);

const s: Project = {
  bpm: 128,
  patterns: [],
  instruments: [],
};

export default new Vuex.Store({
  state: s,
  mutations: {

  },
  actions: {

  },
});
