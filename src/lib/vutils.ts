/**
 * Utils for Vue :)
 */

import ResizeObserver from 'resize-observer-polyfill';
import throttle from 'lodash.throttle';
import { ref, Ref, onUnmounted } from '@vue/composition-api';
import { getLogger } from '@/lib/log';
import { Disposer } from '@/lib/std';

const logger = getLogger('vutils');

export const update = <Props, K extends keyof Props, V extends Props[K]>(
  _: Props, context: { emit: (event: string, value: V) => void }, key: K, value: V,
) => {
  context.emit(`update:${key}`, value);
};

export const createSubscriptions = () => {
  const subscriptions: Disposer[] = [];

  onUnmounted(() => {
    subscriptions.forEach((s) => s.dispose());
  });

  return {
    subscriptions,
  };
};

// FIXME become a hook I'm almost ready
export const useResponsive = (opts: { wait?: number } = {}) => {
  const { wait = 200 } = opts;
  const height = ref(0);
  const width = ref(0);

  const observer = new ResizeObserver(throttle((entries) => {
    const cr = entries[0].contentRect;
    width.value = cr.width;
    height.value = cr.height;
  }, wait));

  return {
    height,
    width,
    observe: observer.observe.bind(observer),
  };
};

export interface Directions {
  didHorizontal: boolean;
  didVertical: boolean;
}

export const unwrap = <T extends string | boolean | number | undefined>(t: T | Ref<T>): T => {
  if (typeof t === 'string') {
    return t;
  } else if (typeof t === 'boolean') {
    return t;
  } else if (typeof t === 'number') {
    return t;
  } else if (typeof t === 'undefined') {
    return t;
  } else {
    return (t as Ref<T>).value;
  }
};

export const Nullable = <V, T extends new() => V>(o: T) => {
  return {
    required: true,
    validator: (prop: any) => {
      const valid = typeof prop === o.name.toLowerCase() || prop === null;
      if (!valid) {
        if (prop === undefined) {
          logger.warn('prop cannot be undefined');
        } else {
          logger.warn(`prop should not be of type ${typeof prop}`);
        }
      }
      return valid;
    },
  };
};

interface ClickerOpts<T extends any[]> {
  onClick: (...args: T) => void;
  onDblClick: (...args: T) => void;
  /**
   * In ms.
   */
  timer?: number;
}

/**
 * Distinguish between single + double clicks.
 */
export const useClicker = <T extends any[] = [MouseEvent]>(opts: ClickerOpts<T>) => {
  let clicks = 0;
  const delay = opts.timer || 150;
  let timer: NodeJS.Timeout | undefined;

  return (...args: T) => {
    clicks++;

    if (clicks === 1) {
      timer = setTimeout(() => {
        opts.onClick(...args);
        clicks = 0;
      }, delay);
    } else {
      if (timer) {
        clearTimeout(timer);
      }

      opts.onDblClick(...args);
      clicks = 0;
    }
  };
};
