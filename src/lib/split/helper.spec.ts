import Vue from 'vue';
import VueCompositionApi from '@vue/composition-api';
Vue.use(VueCompositionApi);

import { expect } from '@/lib/testing';
import { Section, SectionOpts } from '@/lib/split/helper';

const create = ( o?: SectionOpts) => {
  return new Section(o);
};

describe('Split', () => {
  const root = create({ name: 'Root', direction: 'horizontal' });

  const a = create({ name: 'a', direction: 'vertical' });
  const b = create({ name: 'b', direction: 'vertical' });
  const c = create({ name: 'c', initial: 20, minSize: 10 });
  [a, b, c].forEach((node) => node.setParent(root));

  const aa = create({ mode: 'fixed', name: 'aa' });
  const ab = create({ name: 'ab' });
  const ac = create({ mode: 'low', name: 'ac' });
  const ad = create({ collapsible: true, minSize: 15, name: 'ad' });
  [aa, ab, ac, ad].forEach((node) => node.setParent(a));

  const ba = create({ collapsed: true, collapsible: true, minSize: 15, name: 'ba' });
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
    // a can't resize, nothing is "behind" it
    a.move(10);
    expect(a.sizes.width).to.deep.eq(40);
    expect(b.sizes.width).to.deep.eq(40);
    expect(c.sizes.width).to.deep.eq(20);

    // this will resize by 10
    b.move(10);
    expect(a.sizes.width).to.deep.eq(50);
    expect(b.sizes.width).to.deep.eq(30);
    expect(c.sizes.width).to.deep.eq(20);
  });

  it('stops at the max', () => {
    // It will resize by 10, not 20
    b.move(20);
    expect(a.sizes.width).to.deep.eq(60);
    expect(b.sizes.width).to.deep.eq(20);
    expect(c.sizes.width).to.deep.eq(20);

    c.move(10);
    expect(a.sizes.width).to.deep.eq(60);
    expect(b.sizes.width).to.deep.eq(30);
    expect(c.sizes.width).to.deep.eq(10);

    // nothing should happen since the minSize of c is 10
    c.move(10);
    expect(a.sizes.width).to.deep.eq(60);
    expect(b.sizes.width).to.deep.eq(30);
    expect(c.sizes.width).to.deep.eq(10);
  });

  it('resizes correctly with fixed flag', () => {
    ab.move(10);
    expect(aa.sizes.height).to.deep.eq(25);
    expect(ab.sizes.height).to.deep.eq(25);
  });

  it('resizes correctly with keep', () => {
    // ab will resize before ac because ac has the "keep" flag
    ad.move(10);
    expect(ab.sizes.height).to.deep.eq(35);
    expect(ac.sizes.height).to.deep.eq(25);
    expect(ad.sizes.height).to.deep.eq(15);
  });

  it('correctly collapses and un-collapses', () => {
    ad.move(10);
    expect(ad.sizes.height).to.deep.eq(15);

    // ok now ad is at its minSize
    // it will collapse after moving collapsePixels (ie. 5 in our situation) + 1

    // nothing will happen here
    ad.move(10);
    expect(ad.sizes.height).to.deep.eq(15);


    // now it will collapse
    ad.move(11);
    expect(ad.sizes.height).to.deep.eq(0);

    // this will do nothing
    ad.move(-14);
    expect(ad.sizes.height).to.deep.eq(0);

    // and this will un-collapse ad
    ad.move(-15);
    expect(ad.sizes.height).to.deep.eq(15);
  });

  it('correctly collapses when told to do so', () => {
    const sizeChanges: number[] = [];
    toDispose.push(ba.addListeners({
      resize: (value) => {
        sizeChanges.push(value);
      },
    }));

    ad.collapse();
    expect(aa.sizes.height).to.deep.eq(25);
    expect(ab.sizes.height).to.deep.eq(50);
    expect(ac.sizes.height).to.deep.eq(25);
    expect(ad.sizes.height).to.deep.eq(0);

    ad.unCollapse(15);
    expect(aa.sizes.height).to.deep.eq(25);
    expect(ab.sizes.height).to.deep.eq(35);
    expect(ac.sizes.height).to.deep.eq(25);
    expect(ad.sizes.height).to.deep.eq(15);

    expect(sizeChanges).to.deep.eq([]);
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
      height: (value) => {
        heightChanges.push(value);
      },
      resize: (value) => {
        sizeChanges.push(value);
      },
      collapsed: (value) => {
        collapses.push(value);
      },
    }));

    expect(ba.isCollapsed).to.eq(true);

    bb.move(15);
    expect(ba.sizes.height).to.deep.eq(15);
    expect(bb.sizes.height).to.deep.eq(35);
    expect(bc.sizes.height).to.deep.eq(50);
    expect(ba.isCollapsed).to.eq(false);

    bb.move(-11);
    expect(ba.sizes.height).to.deep.eq(0);
    expect(bb.sizes.height).to.deep.eq(50);
    expect(ba.isCollapsed).to.eq(true);

    expect(collapses).to.deep.eq([false, true]);
    expect(heightChanges).to.deep.eq([15, 0]);
    expect(sizeChanges).to.deep.eq([15, 0]);
  });

  it('resizes correctly', () => {
    root.set('height', 80);
    expect(root.sizes.height).to.eq(80);
    expect(a.sizes.height).to.eq(80);
    expect(aa.sizes.height).to.eq(25);
    expect(ab.sizes.height).to.eq(15);
    expect(ac.sizes.height).to.eq(25);
    expect(ad.sizes.height).to.eq(15);
  });

  root.dispose();
});
