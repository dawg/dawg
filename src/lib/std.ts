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

export const copy = <T>(o: T): T => {
  return JSON.parse(JSON.stringify(o));
};

export function mapRange(x: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  return (((x - inMin) * (outMax - outMin)) / (inMax - inMin)) + outMin;
}

export function scale(value: number, from: [number, number], to: [number, number]) {
  return (value - from[0]) * (to[1] - to[0]) / (from[1] - from[0]) + to[0];
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export type ConstructorOf<T> = new (...args: any[]) => T;

export function* reverse <T>(arr: T[]) {
  for (let i = arr.length - 1; i >= 0; i--) {
    yield arr[i];
  }
}

export function literal<T extends string | number | boolean>(value: T): T {
  return value;
}

export const keys = <O>(o: O): Array<keyof O & string> => {
  return Object.keys(o) as Array<keyof O & string>;
};

export const fromEntries = <K extends string, T>(
  entries: Iterable<readonly [K, T]>,
): { [k in K]: T } => {
  const o: Partial<{ [k in K]: T }> = {};
  for (const entry of entries) {
    o[entry[0]] = entry[1];
  }
  return o as { [k in K]: T };
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

export const isDefined = <T>(t: T | undefined): t is T => {
  return t !== undefined;
};

export type Key =
  'Backspace' |
  'Shift' |
  'CmdOrCtrl' |
  'AltOrOption' |
  'Ctrl' |
  'Cmd' |
  'Space' |
  'Esc' |
  'Tab' |
  'Return' |
  'Left' |
  'Up' |
  'Right' |
  'Down' |
  'Delete' |
  'A' |
  'B' |
  'C' |
  'D' |
  'E' |
  'F' |
  'G' |
  'H' |
  'I' |
  'J' |
  'K' |
  'L' |
  'M' |
  'N' |
  'O' |
  'P' |
  'Q' |
  'R' |
  'S' |
  'T' |
  'U' |
  'V' |
  'W' |
  'X' |
  'Y' |
  'Z'
;

type KeyNoVariable = Exclude<Exclude<Key, 'CmdOrCtrl'>, 'AltOrOption'>;

export const Keys: { [K in KeyNoVariable]: number } = {
  Backspace: 8,
  Tab: 9,
  Return: 13,
  Shift: 16,
  Ctrl: 17,
  Esc: 27,
  Space: 32,
  Left: 37,
  Up: 38,
  Right: 39,
  Down: 40,
  Delete: 46,
  A: 65,
  B: 66,
  C: 67,
  D: 68,
  E: 69,
  F: 70,
  G: 71,
  H: 72,
  I: 73,
  J: 74,
  K: 75,
  L: 76,
  M: 77,
  N: 78,
  O: 79,
  P: 80,
  Q: 81,
  R: 82,
  S: 83,
  T: 84,
  U: 85,
  V: 86,
  W: 87,
  X: 88,
  Y: 89,
  Z: 90,
  Cmd: 91,
};

export const Mouse = {
  LEFT: 0,
  MIDDLE: 1,
  RIGHT: 2,
};
