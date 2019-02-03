import { Serialize as S, Deserialize as D, autoserializeAs, autoserialize } from '@/modules/cerialize';
import { expect } from 'chai';

describe('cerialize', () => {
  context('autoserialize', () => {
    it('simple', () => {
      class A {
        @autoserialize public a = 'test';
        @autoserialize public b = 5;
      }

      const a = new A();
      expect(S(a, A)).to.deep.equal({
        a: 'test',
        b: 5,
      });

      expect(D(S(a, A), A)).to.deep.eq(a);
    });
    it('Recursive', () => {
      class A {
        public static create() {
          const a = new A();
          a.a = a;
          return a;
        }
        @autoserializeAs(A) public a!: A;
      }

      const aa = A.create();
      // expect(Deserialize(Serialize(aa, A))).to.deep.eq(aa);
    });
  });
});
