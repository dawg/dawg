import Split from '@/modules/split/Split.vue';
import { PluginObject } from 'vue';

const plugin: PluginObject<{}> = {
  install: (Vue) => {
    Vue.component(Split.name, Split);
  },
};

export default plugin;
