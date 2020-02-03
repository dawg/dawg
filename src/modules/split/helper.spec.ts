import Vue from 'vue';
import VueCompositionApi from '@vue/composition-api';
Vue.use(VueCompositionApi);

import { expect } from '@/testing';
import { ref } from '@vue/composition-api';
import { Split, Direction } from '@/modules/split/helper';

interface Opts {
  direction?: Direction;
  fixed?: boolean;
  initial?: number;
  keep?: boolean;
  collapsible?: boolean;
  maxSize?: number;
  minSize?: number;
  name?: string;
  collapsed?: boolean;
}

const create = (
  {
    direction,
    name = 'Tester',
    fixed = false,
    initial,
    keep = false,
    collapsible = false,
    minSize = 0,
    maxSize = Infinity,
    collapsed = false,
  }: Opts = {},
) => {
  return new Split({
    name,
    direction,
    minSize,
    maxSize,
    collapsePixels: 5,
    initial,
    collapsible,
    fixed,
    keep,
    collapsed,
  });
};

describe.only('Split', () => {
  const root = create({ direction: 'horizontal' });

  const a = create({ direction: 'vertical', maxSize: 50 });
  const b = create({ direction: 'vertical' });
  const c = create({ initial: 20, minSize: 10 });
  [a, b, c].forEach((node) => node.setParent(root));

  const aa = create({ fixed: true, name: 'aa' });
  const ab = create({ name: 'ab' });
  const ac = create({ keep: true, name: 'ac' });
  const ad = create({ collapsible: true, minSize: 15, name: 'ad' });
  [aa, ab, ac, ad].forEach((node) => node.setParent(a));

  const ba = create({ collapsed: true, collapsible: true, minSize: 10, name: 'ba' });
  const bb = create({ name: 'bb' });
  const bc = create({ name: 'bc' });
  [ba, bb, bc].forEach((node) => node.setParent(b));

  let toDispose: Array<{ dispose: () => void }> = [];

  beforeEach(() => {
    root.init({ height: 100, width: 100 });
  });

  afterEach(() => {
    toDispose.forEach((d) => d.dispose());
    toDispose = [];
    root.dispose();
  });

  it('initializes correctly', async () => {
    expect(root.sizes).to.deep.eq({ height: 100, width: 100 });
    expect(a.sizes).to.deep.eq({ height: 100, width: 40 });
    expect(b.sizes).to.deep.eq({ height: 100, width: 40 });
    expect(c.sizes).to.deep.eq({ height: 100, width: 20 });
    expect(ba.sizes).to.deep.eq({ height: 0, width: 40 });
    expect(bb.sizes).to.deep.eq({ height: 50, width: 40 });
    expect(bc.sizes).to.deep.eq({ height: 50, width: 40 });
    expect(aa.sizes).to.deep.eq({ height: 25, width: 40 });
    expect(ab.sizes).to.deep.eq({ height: 25, width: 40 });
    expect(ac.sizes).to.deep.eq({ height: 25, width: 40 });
    expect(ad.sizes).to.deep.eq({ height: 25, width: 40 });
  });

  it('resizing correctly', () => {
    // this shouldn't do anything since there is nothing "behind" a
    a.resize(10);
    expect(a.sizes.width).to.deep.eq(40);
    expect(b.sizes.width).to.deep.eq(40);
    expect(c.sizes.width).to.deep.eq(20);

    // this will resize by 10
    b.resize(10);
    expect(a.sizes.width).to.deep.eq(50);
    expect(b.sizes.width).to.deep.eq(30);
    expect(c.sizes.width).to.deep.eq(20);
  });

  it('stops at the max', () => {
    // It will resize by 10, not 20
    b.resize(20);
    expect(a.sizes.width).to.deep.eq(50);
    expect(b.sizes.width).to.deep.eq(30);
    expect(c.sizes.width).to.deep.eq(20);

    c.resize(10);
    expect(a.sizes.width).to.deep.eq(50);
    expect(b.sizes.width).to.deep.eq(40);
    expect(c.sizes.width).to.deep.eq(10);

    // nothing should happen since the minSize of c is 10
    c.resize(10);
    expect(a.sizes.width).to.deep.eq(50);
    expect(b.sizes.width).to.deep.eq(40);
    expect(c.sizes.width).to.deep.eq(10);
  });

  it('resizes correctly with fixed flag', () => {
    aa.resize(10);
    expect(aa.sizes.height).to.deep.eq(25);
    expect(ab.sizes.height).to.deep.eq(25);
  });

  it('resizes correctly with keep', () => {
    // ab will resize before ac because ac has the "keep" flag
    ad.resize(10);
    expect(ab.sizes.height).to.deep.eq(35);
    expect(ac.sizes.height).to.deep.eq(25);
    expect(ad.sizes.height).to.deep.eq(15);
  });

  it('correctly collapses and un-collapses', () => {
    ad.resize(10);
    expect(ad.sizes.height).to.deep.eq(15);

    // ok now ad is at its minSize
    // it will collapse after moving collapsePixels (ie. 5 in our situation) + 1

    // nothing will happen here
    ad.resize(5);
    expect(ad.sizes.height).to.deep.eq(15);


    // now it will collapse
    ad.resize(6);
    expect(ad.sizes.height).to.deep.eq(0);

    // this will do nothing
    ad.resize(-14);
    expect(ad.sizes.height).to.deep.eq(0);

    // and this will un-collapse ad
    ad.resize(-15);
    expect(ad.sizes.height).to.deep.eq(15);
  });

  it('correctly collapses when told to do so', () => {
    ad.collapse();
    expect(aa.sizes.height).to.deep.eq(25);
    expect(ab.sizes.height).to.deep.eq(50);
    expect(ac.sizes.height).to.deep.eq(25);
    expect(ad.sizes.height).to.deep.eq(0);

    ad.unCollapse();
  });

  it('initializes correctly with collapsed initially set to true', () => {
    expect(ba.sizes.height).to.deep.eq(0);
    expect(bb.sizes.height).to.deep.eq(50);
    expect(bc.sizes.height).to.deep.eq(50);
  });

  it('collapses and un-collapses during resizing and emits the correct events', () => {
    const collapses: boolean[] = [];
    const heightChanges: number[] = [];
    const sizeChanges: number[] = [];
    toDispose.push(ba.addListeners({
      collapsed: (value) => {
        collapses.push(value);
      },
      heightResize: (value) => {
        heightChanges.push(value);
      },
      resize: (value) => {
        sizeChanges.push(value);
      },
    }));

    bb.resize(10);
    expect(ba.sizes.height).to.deep.eq(10);
    expect(bb.sizes.height).to.deep.eq(40);
    expect(bc.sizes.height).to.deep.eq(50);

    bb.resize(-6);
    expect(ba.sizes.height).to.deep.eq(0);
    expect(bb.sizes.height).to.deep.eq(50);

    expect(collapses).to.deep.eq([false, true]);
    expect(heightChanges).to.deep.eq([10, 0]);
    expect(sizeChanges).to.deep.eq([]);
  });

  root.dispose();
});
