import Vue from 'vue';
import ContextMenu from './ContextMenu.vue';
import bus, { Item } from '@/modules/context/bus';


type ContextFunction = (e: MouseEvent, items: Item[]) => void;

export interface ContextInterface {
  $context: ContextFunction;
}

const contextFunction: ContextFunction = (e, items) => {
  e.preventDefault();
  bus.$emit('show', { e, items });
};

const context = {
  install() {
    Vue.component('ContextMenu', ContextMenu);
    Vue.prototype.$context = contextFunction;
  },
};

export { Item } from './bus';
export default context;
