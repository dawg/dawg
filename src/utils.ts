export const BLACK = 'black';

export const WHITE = 'white';

export const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map((note) => ({
  value: note,
  color: note.endsWith('#') ? BLACK : WHITE,
}));

export const range = (a: number, b = 0, interval = 1) => {
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

interface Class {
  new (): any;
}


export class DefaultDict {
  constructor(O: Class) {
    return new Proxy({}, {
      get: (target: any, name: string) => {
        if (name in target) {
          return target[name];
        }
        target[name] = new O();
        return target[name];
      },
    });
  }
}
