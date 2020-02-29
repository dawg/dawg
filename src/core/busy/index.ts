import BusySignal from '@/core/busy/BusySignal.vue';
import { Provider, bus } from '@/core/busy/helpers';
import * as framework from '@/lib/framework';
import { VueConstructor } from 'vue';

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

export const busy = framework.manager.activate({
  id: 'dawg.busy',
  activate: () => {
    const busyFunction: BusyFunction = (message, opts = {}) => {
      const estimate = opts.estimate === undefined ? null : opts.estimate;
      const provider = new Provider(message, estimate);
      bus.emit('start', provider);
      return provider;
    };

    framework.ui.statusBar.push({
      component: BusySignal as any as VueConstructor,
      position: 'right',
      order: 2,
    });

    return busyFunction;
  },
});
