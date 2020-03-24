import { expect } from '@/lib/testing';
import Vue from 'vue';
import VueCompositionApi from '@vue/composition-api';
Vue.use(VueCompositionApi);

import {
  calculateSnap,
  ScrollerOpts,
  calculateScroll,
  getIntersection,
  slice,
  Line,
} from '@/utils';

const calculate = (
  p: { snap?: number, current?: number, new?: number, elOffset?: number, scrollOffset?: number },
) => {
  return expect(calculateSnap({
    event: { clientX: p.new ?? 0 },
    minSnap: 0.25,
    snap: p.snap || 0.5,
    pxPerBeat: 10,
    pxFromLeft: p.current ?? 0,
    reference: {
      scrollLeft: p.scrollOffset,
      getBoundingClientRect: () => ({ left: p.elOffset ?? 0 }),
    },
  }));
};

describe('calculateSnap', () => {
  it('works with the basics', () => {
    calculate({ new: 15, current: 10 }).to.eq(0.5);
    calculate({ new: 17, current: 10 }).to.eq(0.5);
    calculate({ new: 18, current: 10 }).to.eq(1);
  });

  it('works when the current position is not a factor of the snap', () => {
    calculate({ new: 14.5, current: 12.5 }).to.eq(0.25);
    calculate({ new: 15, current: 12.5 }).to.eq(0.75);
    calculate({ new: 16.5, current: 12.5 }).to.eq(0.75);
    calculate({ new: 17.5, current: 12.5 }).to.eq(0.75);
  });

  it('works when reference is not at 0', () => {
    calculate({ new: 14, current: 10, elOffset: 2 }).to.eq(0);
    calculate({ new: 15, current: 10, elOffset: 2 }).to.eq(0.5);
    calculate({ new: 19, current: 10, elOffset: 2 }).to.eq(0.5);
    calculate({ new: 20, current: 10, elOffset: 2 }).to.eq(1);
  });

  it('works when scroll is not 0', () => {
    calculate({ new: 10, current: 10, scrollOffset: 2 }).to.eq(0);
    calculate({ new: 11, current: 10, scrollOffset: 2 }).to.eq(0.5);
    calculate({ new: 16, current: 10, scrollOffset: 2 }).to.eq(1);
  });
});

const scroll = (o: Partial<ScrollerOpts>) => {
  const anchor = o.anchor ?? 2;
  const increment = o.increment ?? 10;
  return expect(calculateScroll({
    scrollOffset: o.scrollOffset ?? 0,
    mousePosition: o.mousePosition ?? anchor * increment,
    elOffset: o.elOffset ?? 0,
    mouvement: o.mouvement ?? 0,
    increment,
    anchor,
  }));
};

describe('computeScroll', () => {
  it('correctly scrolls when initially at 0', () => {
    scroll({ mouvement: 2 }).to.deep.eq({ scroll: -4, increment: 8 });
    scroll({ mouvement: -2 }).to.deep.eq({ scroll: 4, increment: 12 });
  });

  it('correctly scrolls when not at 0', () => {
    scroll({ mouvement: 2, scrollOffset: 10 }).to.deep.eq({ scroll: -4, increment: 8 });
    scroll({ mouvement: -2, scrollOffset: 10 }).to.deep.eq({ scroll: 4, increment: 12 });
  });
});

const g = getIntersection;

describe('getIntersection', () => {
  it('correctly gets easy intersection', () => {
    expect(g({ x1: 0, y1: 0, x2: 1, y2: 1 }, { x1: 0, y1: 1, x2: 1, y2: 0 })).to.deep.eq({
      x: 0.5,
      y: 0.5,
    });
  });

  it('correctly gets intersection where one line is horizontal or vertical', () => {
    expect(g({ x1: 1, y1: 0, x2: 1, y2: 1 }, { x1: 0, y1: 1, x2: 1, y2: 0 })).to.deep.eq({
      x: 1,
      y: 0,
    });

    expect(g({ x1: 0, y1: 1, x2: 1, y2: 1 }, { x1: 0, y1: 1, x2: 1, y2: 0 })).to.deep.eq({
      x: -0,
      y: 1,
    });
  });
});

describe('slice', () => {
  const s = (l: Line) => {
    return expect(slice({
      row: 1,
      time: 1,
      duration: 2,
      ...l,
    })).to.deep;
  };

  // Ok I tried to draw them to help but beware they aren't super exact
  /**
   *  --------------------
   * |   ---/--------
   * |  |  /         |
   * |   -/----------
   * |   /
   */
  it('works correctly with a basic line', () => {
    s({ x1: 1, y1: 3, x2: 2, y2: 0 }).eq({ result: 'slice', time: 1.5 });
  });

  /**
   *  --------------------
   * |   ---|--------
   * |  |   |         |
   * |   ---|--------
   * |
   */
  it('works correctly with a vertical line', () => {
    s({ x1: 2, y1: 3, x2: 2, y2: 0 }).eq({ result: 'slice', time: 2 });
  });

  /**
   *  --------------------
   * |   ------------
   * |  |            |
   * |   ---|--------
   * |      |
   */
  it('doesn\'t slice when there isn\'t enough intersection', () => {
    s({ x1: 2, y1: 4, x2: 2, y2: 1.5 }).eq({ result: 'slice', time: 2 });
    s({ x1: 2, y1: 4, x2: 2, y2: 1.51 }).eq({ result: 'not-enough-overlap', overlap: 0.49 });
  });

  it('doesn\'t slice when the line is horizontal', () => {
    s({ x1: 0, y1: 2, x2: 6, y2: 2 }).eq({ result: 'not-enough-overlap', overlap: 0 });
  });

  it('detects lines that don\'t overlap at all', () => {
    s({ x1: 0, y1: 3, x2: 6, y2: 3 }).eq({ result: 'no-intersection' });
    s({ x1: 0, y1: 0.5, x2: 6, y2: 0 }).eq({ result: 'no-intersection' });
  });

  it('detects out-of-bounds slices', () => {
    s({ x1: 3, y1: 0, x2: 6, y2: 3 }).eq({ result: 'slice-out-of-bounds', time: 4.5 });
  });
});
