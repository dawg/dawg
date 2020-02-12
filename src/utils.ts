import { range } from '@/lib/std';

type Color = 'black' | 'white';

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

export const disposeHelp = (o: { dispose: () => void }) => {
  // Tone.js
  try {
    o.dispose();
  } catch (e) {
    // tslint:disable-next-line:no-console
    console.info(`dispose failed for ${o} =>`, e.message);
  }
};


interface SnapOpts {
  event: { clientX: number, altKey: boolean };
  minSnap: number;
  snap: number;
  pxPerBeat: number;
  pxFromLeft: number;
  reference: { getBoundingClientRect: () => { left: number }, scrollLeft: number };
}

export const calculateSnap = (
  opts: SnapOpts,
) => {
  const snap = opts.event.altKey ? opts.minSnap : opts.snap;
  const remainder = (opts.pxFromLeft / opts.pxPerBeat) % opts.snap;
  const pxRemainder = remainder  * opts.pxPerBeat;

  // The amount of pixels that the element is from the edge of the of grid
  const pxFromEdge = opts.pxFromLeft - opts.reference.scrollLeft;

  // The amount of pixels that the mouse is from the edge of the of grid
  const pxMouse = opts.event.clientX - opts.reference.getBoundingClientRect().left;

  const diff = pxMouse - pxFromEdge - pxRemainder;
  let newValue =  diff / opts.pxPerBeat;
  newValue = (Math.round(newValue / snap) * snap) + remainder;
  return Math.round(newValue / opts.minSnap) * opts.minSnap;
};
