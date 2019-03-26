import BusySignal from '@/modules/BusySignal/BusySignal.vue';
import { Provider, bus } from '@/modules/BusySignal/helpers';

export type BusyFunction = (message: string) => Provider;

export interface BusySignalAugmentation {
  $busy: BusyFunction;
}

export default {
  install(vue: any) {
    const busy: BusyFunction = (message) => {
      const provider = new Provider(message);
      bus.$emit('start', provider);
      return provider;
    };

    vue.component('BusySignal', BusySignal);
    vue.prototype.$busy = busy;
  },
};
