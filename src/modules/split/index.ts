import Split from '@/modules/split/Split.vue';
import SplitArea from '@/modules/split/SplitArea.vue';
import { PluginObject } from 'vue';

const plugin: PluginObject<{}> = {
  install: (Vue) => {
    [Split, SplitArea].forEach((component) => {
      Vue.component(component.name, component);
    });
  },
};

export default plugin;
