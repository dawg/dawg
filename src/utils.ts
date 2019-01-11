import Tone from 'tone';
import { Mutation } from 'vuex-module-decorators';

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
let noteNumber = -octaveKeys.length + 1;  // A bit hacky but we want to start at C8 and end at A0
range(0, 9).reverse().forEach((value) => {
  octaveKeys.forEach((key) => {
    if (noteNumber >= 0 && noteNumber < 88) {
      allKeys.push({
        value: `${key}${value}`,
        color: key.endsWith('#') ? 'black' : 'white',
        id: noteNumber,
      });
    }
    noteNumber += 1;
  });
});


export const copy = <T>(o: T): T => {
  return JSON.parse(JSON.stringify(o));
};


export const Nullable = (o: { new(): object }) => {
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
  SHIFT: 16,
  DELETE: 46,
  BACKSPACE: 8,
  SPACE: 32,
};


export const Button = {
  LEFT: 0,
  MIDDLE: 1,
  RIGHT: 2,
};

export function MapField<T extends MapFieldSetter, V>(module: T, o: V) {
  return (target: object, name: keyof V) => {
    Object.defineProperty(target, name, {
      get() {
        return o[name];
      },
      set(value) {
        // Call the mutation.
        module.setValue({o, key: name, value});
      },
      enumerable: true,
      configurable: true,
    });
  };
}

export interface MapFieldSetter {
  setValue<T, V extends keyof T>(payload: { o: T, key: V, value: any }): void;
}

export type ConstructorOf<T> = new(...args: any[]) => T;

export function Setter<T extends ConstructorOf<{}>>(Base: T) {
    class WithSetter extends Base implements MapFieldSetter {
      @Mutation
      public setValue<A, V extends keyof A>(payload: { o: A, key: V, value: any }) {
        payload.o[payload.key] = payload.value;
      }
    }

    return WithSetter;
}

export function toTickTime(time: number) {
  return `${time * Tone.Transport.PPQ}i`;
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
