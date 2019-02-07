import Vue from 'vue';
import bus from '@/modules/knobs/bus';
import Knob from '@/modules/knobs/Knob.vue';

export interface KnobAugmentation<T> {
  $automate: <V extends T>(automatable: V, key: keyof V) => void;
}

export const automation = bus;

export default {
  install() {
    Vue.component('Knob', Knob);

    Vue.prototype.$automate = <V>(automatable: V, key: keyof V) => {
      bus.$emit('automate', automatable, key);
    };
  },
};
