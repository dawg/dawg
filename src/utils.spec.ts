import { expect } from '@/lib/testing';
import { calculateSnap } from '@/utils';

describe.only('calculateSnap', () => {
  it('works', () => {
    // TODO more!
    expect(calculateSnap({
      event: { clientX: 15, altKey: false },
      minSnap: 0.25,
      snap: 0.5,
      pxPerBeat: 10,
      pxFromLeft: 10,
      reference: { scrollLeft: 0, getBoundingClientRect: () => ({ left: 0 }) },
    })).to.eq(0.5);
  });
});
