import Vue from 'vue';
import ContextMenu from '@/modules/context/ContextMenu.vue';
import bus, { Item, isMouseEvent, Position } from '@/modules/context/bus';


type ContextFunction = (e: MouseEvent | Position, items: Array<Item | null>) => void;

export interface ContextInterface {
  $context: ContextFunction;
  $menu: ContextFunction;
}

interface Options {
  default?: Item[];
}

const context = {
  install(vue: any, options: Options = {}) {
    vue.component('ContextMenu', ContextMenu);

    const defaultItems = options.default || [];
    const contextFunction: ContextFunction = (e, items) => {
      if (isMouseEvent(e)) {
        e.preventDefault();
        e.stopPropagation();
      }

      bus.$emit('show', { e, items: [...items, null, ...defaultItems] });
    };

    const menuFunction: ContextFunction = (e, items) => {
      if (isMouseEvent(e)) {
        e.stopPropagation();
      }
      bus.$emit('show', { e, items });
    };

    Vue.prototype.$context = contextFunction;
    Vue.prototype.$menu = menuFunction;
  },
};

export default context;
