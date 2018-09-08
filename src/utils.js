export const BLACK = 'black';

export const WHITE = 'white';

export const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(note => ({
  value: note,
  color: note.endsWith('#') ? BLACK : WHITE,
}));

export const range = (a, b = 0, interval = 1) => {
  let start;
  let end;
  if (a > b) {
    start = 0; end = a;
  } else {
    start = a; end = b;
  }
  const rge = [];
  for (let i = start; i <= end; i += interval) {
    rge.push(i);
  }
  return rge;
};

export const TREE = {
  root: {
    'folder 1': {
      'item 1': {},
      'folder 2': {
        'item 2': {},
      },
    },
    'item 3': {},
  },
};

export const replace = (array, i, item) => {
  if (item) {
    return [...array.slice(0, i), item, ...array.slice(i + 1, array.length)];
  }
  return [...array.slice(0, i), ...array.slice(i + 1, array.length)];
};

export class DefaultDict {
  constructor(O) {
    return new Proxy({}, {
      get: (target, name) => {
        if (name in target) {
          return target[name];
        }
        // eslint-disable-next-line no-param-reassign
        target[name] = typeof O === 'function' ? new O().valueOf() : O;
        return target[name];
      },
    });
  }
}
