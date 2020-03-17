import { prim, derived } from '@/lib/reactor';
import { expect } from '@/lib/testing';

describe('reactor', () => {
  describe('prim', () => {
    it('constructs correctly', () => {
      const o = prim(5);
      expect(o.value).to.eq(5);
    });

    it('can be set', () => {
      const o = prim(5);
      o.value = 10;
      expect(o.value).to.eq(10);
    });

    it('triggers watchers', () => {
      const o = prim(5);

      let newValue: number | undefined;
      const disposer = o.onDidChange((context) => {
        newValue = context.newValue;
      });

      o.value = 10;
      expect(newValue).to.eq(10);
      disposer.dispose();
    });
  });

  describe('derived', () => {
    it('constructs correctly', () => {
      const o = derived(() => 5 * 5);
      expect(o.value).to.eq(25);
    });

    it('updates correctly 1 level deep', () => {
      const a = prim(5);
      const b = derived(() => a.value * 5);
      expect(b.value).to.eq(25);

      a.value = 10;
      expect(b.value).to.eq(50);
    });

    it('updates correctly 2 level deep', () => {
      const a = prim(5);
      const b = derived(() => a.value * 5);
      const c = derived(() => b.value * 5);
      expect(c.value).to.eq(125);

      a.value = 10;
      expect(c.value).to.eq(250);
    });
  });
});
