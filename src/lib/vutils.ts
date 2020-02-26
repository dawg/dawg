/**
 * Utils for Vue :)
 */

import ResizeObserver from 'resize-observer-polyfill';
import throttle from 'lodash.throttle';
import { ref, Ref } from '@vue/composition-api';
import Vue from 'vue';
import Component from 'vue-class-component';

export const update = <Props, K extends keyof Props, V extends Props[K]>(
  _: Props, context: { emit: (event: string, value: V) => void }, key: K, value: V,
) => {
  context.emit(`update:${key}`, value);
};

// FIXME become a hook I'm almost ready
export const useResponsive = (el: Element, opts: { wait?: number } = {}) => {
  const { wait = 200 } = opts;
  const height = ref(0);
  const width = ref(0);

  const observer = new ResizeObserver(throttle((entries) => {
    const cr = entries[0].contentRect;
    width.value = cr.width;
    height.value = cr.height;
  }, wait));

  observer.observe(el);

  return {
    height,
    width,
  };
};

export interface Directions {
  didHorizontal: boolean;
  didVertical: boolean;
}

@Component
export class ResponsiveMixin extends Vue {
  public width = 0;
  public height = 0;
  public mounted() {
    this.$nextTick(() => {
      const handleResize = throttle((entries) => {
        const cr = entries[0].contentRect;
        const didHorizontal = this.width !== cr.width;
        const didVertical = this.height !== cr.height;
        this.width = cr.width;
        this.height = cr.height;

        if (!didHorizontal && !didVertical) { return; }
        this.onResize({ didHorizontal, didVertical });
      }, 200);

      const observer = new ResizeObserver(handleResize);
      if (this.$el instanceof Element) {
        observer.observe(this.$el);
      } else {
        // tslint:disable-next-line:no-console
        console.warn('Not adding resize watcher');
      }
    });
  }
  public onResize(direction: Directions) {
    //
  }
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
          // tslint:disable-next-line:no-console
          console.warn('prop cannot be undefined');
        } else {
          // tslint:disable-next-line:no-console
          console.warn(`prop should not be of type ${typeof prop}`);
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
