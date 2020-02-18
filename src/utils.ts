import { range, clamp } from '@/lib/std';

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


// This is a slightly weird API but it the best API for the job
export interface SnapOpts {
  event: { clientX: number, altKey?: boolean };
  minSnap: number;
  snap: number;
  pxPerBeat: number;
  /**
   * Px from left of REFERENCE. ie. the amount of pixels that the element is from the edge of the element.
   */
  pxFromLeft: number;
  /**
   * Reference information. Usually just pass in the element.
   */
  reference: { getBoundingClientRect: () => { left: number }, scrollLeft?: number };
}

export const calculateSnap = (
  opts: SnapOpts,
) => {
  const snap = opts.event.altKey ? opts.minSnap : opts.snap;
  const remainder = (opts.pxFromLeft / opts.pxPerBeat) % opts.snap;
  // const pxRemainder = remainder  * opts.pxPerBeat;

  // The amount of pixels that the mouse is from the edge of the of grid
  const pxMouseFromLeft =
    opts.event.clientX -
    opts.reference.getBoundingClientRect().left +
    (opts.reference.scrollLeft ?? 0);

  const diff = pxMouseFromLeft - opts.pxFromLeft; // - pxRemainder;
  let newValue =  diff / opts.pxPerBeat;
  newValue = (Math.round(newValue / snap) * snap) + remainder;
  return Math.round(newValue / opts.minSnap) * opts.minSnap;
};

export interface SimpleSnapOpts {
  value: number;
  altKey?: boolean;
  minSnap: number;
  snap: number;
  pxPerBeat: number;
  round?: (arg: number) => number;
}

export const calculateSimpleSnap = (
  opts: SimpleSnapOpts,
) => {
  const snap = opts.altKey ? opts.minSnap : opts.snap;

  const round = opts.round ?? Math.round;

  // The amount of pixels that the mouse is from the edge of the of grid
  let newValue =  opts.value / opts.pxPerBeat;
  newValue = (round(newValue / snap) * snap);
  return (round(newValue / opts.minSnap) * opts.minSnap) * opts.pxPerBeat;
};

export interface ScrollerOpts {
  scrollOffset: number;
  elOffset: number;
  mousePosition: number;
  /**
   * The mouvement (ie. deltaY) value from the wheel event.
   * Positive mouvement means shrinking and negative mouvement means growing.
   */
  mouvement: number;
  increment: number;
  anchor: number;
  maxSize?: number;
  minSize?: number;
}

export const calculateScroll = (o: ScrollerOpts) => {
  const newSize = clamp(o.increment - o.mouvement, o.minSize ?? 3, o.maxSize ?? 80);

  const rowOrCol = Math.floor(o.anchor);
  const extraPx = (o.anchor - rowOrCol) * newSize;
  const newPosition = newSize * rowOrCol + extraPx;

  // Get the diff between the desired position and the actual position
  // then add that to the scroll position
  const screenSpace = o.mousePosition - o.elOffset;
  const scroll = newPosition - screenSpace;

  return {
    scroll,
    increment: newSize,
  };
};

const slope = (x1: number, y1: number, x2: number, y2: number) => {
  if (x1 === x2) { return Infinity; }
  return (y1 - y2) / (x1 - x2);
};

const yInt = (x1: number, y1: number, x2: number, y2: number) => {
  if (x1 === x2) { return y1 === 0 ? 0 : Infinity; }
  if (y1 === y2) { return y1; }
  return y1 - slope(x1, y1, x2, y2) * x1 ;
};

export interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export const getIntersection = (
  l1: Line,
  l2: Line,
) => {
  const { x1: x11, y1: y11, x2: x12, y2: y12 } = l1;
  const { x1: x21, y1: y21, x2: x22, y2: y22 } = l2;
  const slope1 = slope(x11, y11, x12, y12);
  const slope2 = slope(x21, y21, x22, y22);
  if (slope1 === slope2) { return; }

  const yint1 = yInt(x11, y11, x12, y12);
  const yint2 = yInt(x21, y21, x22, y22);

  let point: { x: number, y: number };
  if (slope1 === Infinity) {
    point = {
      x: x11,
      y: slope2 * x11 + yint2,
    };
  } else if (slope2 === Infinity) {
    point = {
      x: x21,
      y: slope1 * x21 + yint1,
    };
  } else {
    const intx = (yint1 - yint2) / (slope2 - slope1);
    point = { x: intx, y: slope1 * intx + yint1 };
  }

  // console.log(slope1, yint1);
  // console.log(slope2, yint2);

  return point;
};

type SliceResult =
  { result: 'no-intersection' } |
  { result: 'not-enough-overlap', overlap: number } |
  { result: 'slice-out-of-bounds', time: number } |
  { result: 'unknown' } |
  { result: 'slice', time: number };

export const slice = (
  o: { row: number, time: number, duration: number, pxPerBeat?: number, rowHeight?: number } & Line,
): SliceResult => {
  const pxPerBeat = o.pxPerBeat ?? 1;
  const rowHeight = o.rowHeight ?? 1;
  const time = o.time * pxPerBeat;
  const duration = o.duration * pxPerBeat;
  const row = o.row * rowHeight;
  const rowPlOne = row + rowHeight;
  const { maxY, minY } = o.y1 > o.y2 ? { maxY: o.y1, minY: o.y2 } : { maxY: o.y2, minY: o.y1 };
  const { maxX, minX } = o.x1 > o.x2 ? { maxX: o.x1, minX: o.x2 } : { maxX: o.x2, minX: o.x1 };

  const elX1 = time;
  const elX2 = time + duration;
  if (
    minY > rowPlOne ||
    maxY < row ||
    minX > elX2 ||
    maxX < elX1
  ) {
    return {
      result: 'no-intersection',
    };
  }

  // In the following example, overlapY would be about 50% (0.50)
  // The maximum value would be 100% (1.00)
  // --------------
  //
  //   /
  // -/-------------
  // /
  const overlapY = Math.min(maxY, rowPlOne) - Math.max(minY, row);
  if (overlapY < 0.5) {
    return {
      result: 'not-enough-overlap',
      overlap: overlapY,
    };
  }

  const i1 = getIntersection(o, { x1: elX1, y1: row, x2: elX2, y2: row });
  const i2 = getIntersection(o, { x1: elX1, y1: rowPlOne, x2: elX2, y2: rowPlOne });

  if (!i1 || !i2) {
    // We should never have to return this
    // If we do, we should debug
    return {
      result: 'unknown',
    };
  }

  const sliceTime = (i1.x + i2.x) / 2;
  if (sliceTime < elX1 || sliceTime > elX2) {
    return {
      result: 'slice-out-of-bounds',
      time: sliceTime,
    };
  }

  // tslint:disable-next-line:no-console
  console.log(i1.x, i2.x, {
    result: 'slice',
    sliceTime: sliceTime / pxPerBeat,
  });
  return {
    result: 'slice',
    time: sliceTime / pxPerBeat,
  };
};
