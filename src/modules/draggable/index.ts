import DragElement from '@/modules/draggable/DragElement.vue';

export default {
  // tslint:disable-next-line:no-shadowed-variable
  install(Vue: any) {
    Vue.component('DragElement', DragElement);
  },
};

export {
  DragElement,
};
