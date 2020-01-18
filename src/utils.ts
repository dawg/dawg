import Vue from 'vue';
import Component from 'vue-class-component';
import ResizeObserver from 'resize-observer-polyfill';
import throttle from 'lodash.throttle';
import { createComponent, Ref } from '@vue/composition-api';

type Color = 'black' | 'white';

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

export const range = (a: number, b = 0, interval = 1) => {
  let start;
  let end;
  if (a > b) {
    start = 0; end = a;
  } else {
    start = a; end = b;
  }
  const rge = [];
  for (let i = start; i < end; i += interval) {
    rge.push(i);
  }
  return rge;
};

interface OctaveKey {
  value: string;
  color: Color;
  id: number;
}

const octaveKeys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].reverse();
export const allKeys: OctaveKey[] = [];
export const keyLookup: { [key: string]: OctaveKey } = {};
let noteNumber = -octaveKeys.length + 1;  // A bit hacky but we want to start at C8 and end at A0
range(0, 9).reverse().forEach((value) => {
  octaveKeys.forEach((key) => {
    if (noteNumber >= 0 && noteNumber < 88) {
      const keyString = `${key}${value}`;
      allKeys.push({
        value: keyString,
        color: key.endsWith('#') ? 'black' : 'white',
        id: noteNumber,
      });
      keyLookup[keyString] = allKeys[allKeys.length - 1];
    }
    noteNumber += 1;
  });
});



export const copy = <T>(o: T): T => {
  return JSON.parse(JSON.stringify(o));
};

export function mapRange(x: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  return (((x - inMin) * (outMax - outMin)) / (inMax - inMin)) + outMin;
}

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


export const Keys = {
  ENTER: 13,
  SHIFT: 16,
  DELETE: 46,
  BACKSPACE: 8,
  SPACE: 32,
  UP: 38,
  DOWN: 40,
  RIGHT: 39,
  LEFT: 37,
};

export const Button = {
  LEFT: 0,
  MIDDLE: 1,
  RIGHT: 2,
};

export const findUniqueName = (objects: Array<{ name: string }>, prefix: string) => {
  let name: string;
  let count = 1;
  while (true) {
    name = `${prefix} ${count}`;
    let found = false;
    for (const o of objects) {
      if (o.name === name) {
        found = true;
        break;
      }
    }

    if (!found) {
      break;
    }

    count++;
  }

  return name;
};

export function scale(value: number, from: [number, number], to: [number, number]) {
  return (value - from[0]) * (to[1] - to[0]) / (from[1] - from[0]) + to[0];
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}


export type ConstructorOf<T> = new (...args: any[]) => T;

export const disposeHelp = (o: { dispose: () => void }) => {
  // Tone.js
  try {
    o.dispose();
  } catch (e) {
    // tslint:disable-next-line:no-console
    console.info(`dispose failed for ${o} =>`, e.message);
  }
};

export function* reverse <T>(arr: T[]) {
  for (let i = arr.length - 1; i >= 0; i--) {
    yield arr[i];
  }
}

export type Primitive = string | number | boolean | undefined | null;

export function literal<T extends Primitive>(value: T): T {
  return value;
}

type Events = keyof WindowEventMap;

type EventListener<K extends Events> = (ev: WindowEventMap[K]) => any;

type EventListeners = {
  [P in keyof WindowEventMap]?: EventListener<P> | 'remove';
};

/**
 * Add 0 or more event listeners and return an object with a dispose method to remove the listeners.
 *
 * @param events The events.
 * @param options The options.
 */
export const addEventListeners = (
  events: EventListeners,
  options?: boolean | AddEventListenerOptions,
) => {
  const types = Object.keys(events) as Events[];

  const remove = () => {
    for (const type of types) {
      const ev = events[type];
      if (ev === 'remove') {
        continue;
      }

      window.removeEventListener(type, ev as any);
    }
  };

  for (const type of types) {
    const ev = events[type];
    if (ev === 'remove') {
      // @ts-ignore
      // There is a weird error with union types
      // Going to just ignore this
      events[type] = remove;
    }
    window.addEventListener(type, ev as any, options);
  }


  return {
    dispose: remove,
  };
};

/**
 * Add an event listener (like normal) but return an object with a dispose method to remove the same listener.
 *
 * @param type The event.
 * @param ev The listener.
 * @param options The options.
 */
export const addEventListener = <K extends Events>(
  type: K,
  ev: EventListener<K>,
  options?: boolean | AddEventListenerOptions,
) => {
  window.addEventListener(type, ev, options);

  return {
    dispose: () => {
      window.removeEventListener(type, ev);
    },
  };
};

export const keys = <O>(o: O): Array<keyof O & string> => {
  return Object.keys(o) as Array<keyof O & string>;
};

export const mapObject = <V, T, O extends { [k: string]: V }>(o: O, f: (v: V) => T) => {
  const transformed: { [k: string]: T } = {};
  for (const key of keys(o)) {
    transformed[key] = f(o[key]);
  }
  return transformed as { [K in keyof O]: T };
};

export const uniqueId = () => {
  return Math.random().toString().substr(2, 9);
};

export const update = <Props, K extends keyof Props, V extends Props[K]>(
  props: Props, context: { emit: (event: string, value: V) => void }, key: K, value: V,
) => {
  context.emit(`update:${key}`, value);
};

// This is a temporary workaround. Right now, TypeScript throws an error when you pass in the return type of
// createComponent to the Vue.extend function
export const vueExtend = (proxy: ReturnType<typeof createComponent>) => {
  return Vue.extend(proxy as any);
};

export interface Directions {
  didHorizontal: boolean;
  didVertical: boolean;
}

// FIXME become a hook I'm almost ready
// export const useResponsive = (el: Element, opts: { wait?: number } = {}) => {
//   const { wait = 200 } = opts;
//   const height = ref(0);
//   const width = ref(0);

//   const observer = new ResizeObserver(throttle((entries) => {
//     const cr = entries[0].contentRect;
//     width.value = cr.width;
//     height.value = cr.height;
//   }, wait));

//   observer.observe(el);

//   return {
//     height,
//     width,
//   };
// };
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

export function* chain<T>(...arrays: T[][]) {
  for (const array of arrays) {
    for (const item of array) {
      yield item;
    }
  }
}

export const makeLookup = <T extends { id: string }>(array: Iterable<T>) => {
  const lookup: { [k: string]: T } = {};
  for (const item of array) {
    lookup[item.id] = item;
  }
  return lookup;
};

interface Ordered {
  order?: number;
}

export const sortOrdered = (a: Ordered, b: Ordered) => {
  return (a.order || 0) - (b.order || 0);
};
