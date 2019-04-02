import BusySignal from '@/modules/BusySignal/BusySignal.vue';
import { Provider, bus } from '@/modules/BusySignal/helpers';

/**
 * The configuration options.
 */
export interface BusySignalOptions {
  /**
   * If this is set, we will simulate progress using `setTimeout`. Units are in seconds. For example, if you set
   * estimate to 20, the progress bar will take approximately 20 seconds to go from 0 to 100.
   */
  estimate?: number;
}

export type BusyFunction = (message: string, options?: BusySignalOptions) => Provider;

export interface BusySignalAugmentation {
  /**
   * Start a busy signal. Use the options to configure the behavior.
   */
  $busy: BusyFunction;
}

export default {
  install(vue: any) {
    const busy: BusyFunction = (message, opts = {}) => {
      const estimate = opts.estimate === undefined ? null : opts.estimate;
      const provider = new Provider(message, estimate);
      bus.emit('start', provider);
      return provider;
    };

    vue.component('BusySignal', BusySignal);
    vue.prototype.$busy = busy;
  },
};
