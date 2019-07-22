import Tone from 'tone';
import Vue from 'vue';
import { PropsDefinition, ComponentOptions } from 'vue/types/options';
import { Context } from 'vue-function-api/dist/types/vue';

export enum StyleType {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  ACCENT = 'accent',
  ERROR = 'error',
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
}

interface StyleOptions {
  darken?: number;
  lighten?: number;
  text?: boolean;
}

export const makeLookup = <T>(items: T[], getter: (item: T) => string) => {
  const lookup: {[key: string]: T} = {};
  items.forEach((item) => {
    lookup[getter(item)] = item;
  });
  return lookup;
};

export const makeStyle = (type: StyleType, options?: StyleOptions) => {
  options = options || {};

  if (options.darken !== undefined && options.lighten !== undefined) {
      throw Error('both `darken` and `lighten` cannot be given');
    }

  const validate = (v?: number) => {
      if (v === undefined) { return; }
      if (v >= 0 && v <= 4) { return; }
      throw Error('`darken` or `lighten` must be >= 0 and <= 4, not ' + v);
    };

  validate(options.darken);
  validate(options.lighten);

  let str = `${type}`;

  if (options.lighten !== undefined && options.lighten !== 0) {
      str += `-lighten-${options.lighten}`;
    } else if (options.darken !== undefined && options.darken !== 0) {
      str += `-darken-${options.darken}`;
    }

  if (options.text !== undefined) {
      str += '--text';
    }

  return str;
};

type Color = 'black' | 'white';

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


export const Keys = {
  ENTER: 13,
  SHIFT: 16,
  DELETE: 46,
  BACKSPACE: 8,
  SPACE: 32,
  UP: 38,
  DOWN: 40,
};


export const Button = {
  LEFT: 0,
  MIDDLE: 1,
  RIGHT: 2,
};

export function toTickTime(time: number) {
  // FIXME(3) is ceil right?
  return `${Math.ceil(time * Tone.Transport.PPQ)}i`;
}


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


export class UnreachableCaseError extends Error {
  constructor(value: never) {
    super(`Unreachable case: ${value}`);
  }
}

export const addDisposableListener = <K extends keyof WindowEventMap>(
  type: K, cb: (ev: WindowEventMap[K]) => any,
) => {
  window.addEventListener(type, cb);

  return {
    dispose() {
      window.removeEventListener(type, cb);
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

// FIXME Remove when https://github.com/vuejs/vue-function-api/issues/15 is resolved
type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
type ComponentOptionsWithSetup<Props> = Omit<ComponentOptions<Vue>, 'props' | 'setup'> & {
  props?: PropsDefinition<Props>;
  setup?: (
    this: undefined,
    props: Readonly<Props>,
    context: Context,
  ) => object | null | undefined | void;
};

// when props is an object
export function createComponent<Props>(
  compOptions: ComponentOptionsWithSetup<Props>,
): ComponentOptions<Vue>;
// when props is an array
export function createComponent<Props extends string = never>(
  compOptions: ComponentOptionsWithSetup<Record<Props, any>>,
): ComponentOptions<Vue>;

export function createComponent<Props>(
  compOptions: ComponentOptionsWithSetup<Props>,
): ComponentOptions<Vue> {
  return (compOptions as any) as ComponentOptions<Vue>;
}

// Remove until here

export const update = <Props, K extends keyof Props, V extends Props[K]>(
  props: Props, context: { emit: (event: string, value: V) => void }, key: K, value: V,
) => {
  context.emit(`update:${key}`, value);
};
