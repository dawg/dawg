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
}

const create = (
  {
    direction,
    fixed = false,
    initial,
    keep = false,
    collapsible = false,
    minSize = 0,
    maxSize = Infinity,
  }: Opts = {},
) => {
  return new Split({
    name: ref('Tester'),
    direction,
    minSize: ref(minSize),
    maxSize: ref(maxSize),
    collapsePixels: ref(5),
    initial: ref(initial),
    collapsible: ref(collapsible),
    fixed: ref(fixed),
    keep: ref(keep),
  });
};

describe.only('Split', () => {
  const root = create({ direction: 'horizontal' });

  const a = create({ direction: 'vertical', maxSize: 50 });
  const b = create();
  const c = create({ initial: 20, minSize: 10 });
  [a, b, c].forEach((node) => node.setParent(root));

  const aa = create({ fixed: true });
  const ab = create();
  const ac = create({ keep: true });
  const ad = create({ collapsible: true, minSize: 15 });
  [aa, ab, ac, ad].forEach((node) => node.setParent(a));

  beforeEach(() => {
    root.init({ height: 100, width: 100 });
  });

  afterEach(() => {
    root.dispose();
  });

  it('in initializes correctly', async () => {
    expect(root.sizes).to.deep.eq({ height: 100, width: 100 });
    expect(a.sizes).to.deep.eq({ height: 100, width: 40 });
    expect(b.sizes).to.deep.eq({ height: 100, width: 40 });
    expect(c.sizes).to.deep.eq({ height: 100, width: 20 });
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
    ac.resize(5);
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
  });

  root.dispose();
});
