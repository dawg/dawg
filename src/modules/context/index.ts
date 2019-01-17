import Vue from 'vue';
import ContextMenu from '@/modules/context/ContextMenu.vue';
import bus, { Item } from '@/modules/context/bus';


type ContextFunction = (e: MouseEvent, items: Item[]) => void;

export interface ContextInterface {
  $context: ContextFunction;
}

interface Options {
  default?: Item[];
}

const context = {
  install(vue: any, options: Options = {}) {
    Vue.component('ContextMenu', ContextMenu);

    const defaultItems = options.default || [];
    const contextFunction: ContextFunction = (e, items) => {
      e.preventDefault();
      bus.$emit('show', { e, items: [...items, ...defaultItems] });
    };

    Vue.prototype.$context = contextFunction;
  },
};

export default context;
