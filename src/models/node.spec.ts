import { GraphNode } from '@/models/node';
import * as Audio from '@/lib/audio';
import { expect } from '@/lib/testing';

const create = (name: string) => {
  return new GraphNode(Audio.createGain(), name);
};

describe('GraphNode', () => {
  it('creates and disposes', () => {
    const node = create('A');
    node.dispose();
  });

  it('can connect and disconnect', () => {
    const a = create('A');
    const b = create('B');
    const disposer = a.connect(b);
    expect(a.inputOf(b)).to.eq(true);
    expect(b.outputOf(a)).to.eq(true);

    disposer.dispose();
    expect(!a.inputOf(b)).to.eq(true);
    expect(!b.outputOf(a)).to.eq(true);

    a.dispose();
    b.dispose();
  });

  it('can have two inputs and replace', () => {
    const a = create('A');
    const b = create('B');
    const c = create('C');
    const gain = Audio.createGain();

    a.connect(c);
    b.connect(c);

    expect(a.inputOf(c)).to.eq(true);
    expect(b.inputOf(c)).to.eq(true);

    c.replace(gain);
    expect(a.inputOf(c)).to.eq(true);
    expect(b.inputOf(c)).to.eq(true);
    expect(c.outputOf(a)).to.eq(true);
    expect(c.outputOf(b)).to.eq(true);

    a.dispose();
    b.dispose();
    c.dispose();
    gain.dispose();
  });

  it('can redirect', () => {
    const a = create('A');
    const b = create('B');
    const c = create('C');
    const d = create('D');

    a.connect(c);
    b.connect(c);
    expect(a.inputOf(c)).to.eq(true);
    expect(b.inputOf(c)).to.eq(true);

    c.redirect(d);
    expect(!a.inputOf(c)).to.eq(true);
    expect(!b.inputOf(c)).to.eq(true);
    expect(a.inputOf(d)).to.eq(true);
    expect(b.inputOf(d)).to.eq(true);

    a.dispose();
    b.dispose();
    c.dispose();
    d.dispose();
  });

  it('can print to a string', () => {
    const a = create('A');
    const b = create('B');
    const c = create('C');

    a.connect(b);
    b.connect(c);

    expect(a.toString()).to.eq('C < B < A');
    expect(a.toString()).to.eq(b.toString());
    expect(b.toString()).to.eq(c.toString());

    a.connect(c);

    expect(a.toString()).to.eq('C\n  B\n  A');

    a.dispose();
    b.dispose();
    c.dispose();
  });

  it('can dispose', () => {
    const a = create('A');
    const b = create('B');
    const c = create('C');
    const d = create('D');

    a.connect(c);
    b.connect(c);
    c.connect(d);

    let disposer = d.dispose();
    expect(c.inputOf(d)).to.eq(false);
    expect(d.outputOf(c)).to.eq(false);

    disposer.dispose();
    expect(c.inputOf(d)).to.eq(true);
    expect(d.outputOf(c)).to.eq(true);

    disposer = c.dispose();
    expect(c.inputOf(d)).to.eq(false);
    expect(a.inputOf(c)).to.eq(false);
    expect(b.inputOf(c)).to.eq(false);

    disposer.dispose();
    expect(c.inputOf(d)).to.eq(true);
    expect(a.inputOf(c)).to.eq(true);
    expect(b.inputOf(c)).to.eq(true);

    disposer = a.dispose();
    expect(a.inputOf(c)).to.eq(false);

    disposer.dispose();
    expect(a.inputOf(c)).to.eq(true);

    a.dispose();
    b.dispose();
    c.dispose();
    d.dispose();
  });
});
