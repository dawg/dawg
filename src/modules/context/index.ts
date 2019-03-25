import Vue from 'vue';
import ContextMenu from '@/modules/context/ContextMenu.vue';
import bus, { Item, isMouseEvent, ContextPayload } from '@/modules/context/bus';


type ContextFunction = (opts: ContextPayload) => void;

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
    const contextFunction: ContextFunction = (opts) => {
      if (isMouseEvent(opts.event)) {
        opts.event.preventDefault();
        opts.event.stopPropagation();
      }

      bus.$emit('show', { ...opts, items: [...opts.items, null, ...defaultItems] });
    };

    const menuFunction: ContextFunction = (opts) => {
      if (isMouseEvent(opts.event)) {
        opts.event.stopPropagation();
      }
      bus.$emit('show', opts);
    };

    Vue.prototype.$context = contextFunction;
    Vue.prototype.$menu = menuFunction;
  },
};

export default context;
