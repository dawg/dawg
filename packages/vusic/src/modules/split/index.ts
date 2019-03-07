import Vue from 'vue';
import Split from '@/modules/split/Split.vue';
import { PluginObject } from 'vue';

const plugin: PluginObject<{}> = {
  install: () => {
    Vue.component('Split', Split);
  },
};

export default plugin;
