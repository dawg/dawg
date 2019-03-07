import {
  serialize as S,
  deserialize as D,
  autoserializeAs,
  autoserialize,
  autoserializeIndexable,
  inheritSerialization,
  is,
  attr,
} from '@/modules/cerialize';
import { expect } from 'chai';

class A {
  @autoserialize public a = 'test';
  @autoserialize public b = 5;
  public bad = '5';
}

class B {
  @autoserializeAs(A) public as: A[] = [];
}

class C {
  @autoserializeIndexable(A) public as: { [k: string]: A } = {};
}

describe('cerialize', () => {
  context('attr', () => {
    it('simple', () => {
      class G {
        @attr('value') public element = {
          value: 5,
        };
      }

      const g = new G();
      expect(S(g, G)).to.deep.eq({ element: 5 });
      expect(D({ element: 5 }, G)).to.deep.eq(g);
    });
  });

  context('autoserialize', () => {
    it('simple', () => {
      const a = new A();
      expect(S(a, A)).to.deep.equal({
        a: 'test',
        b: 5,
      });

      expect(D(S(a, A), A)).to.deep.eq(a);
    });
  });

  it('deserialize', () => {
    const start = { a: 'test', b: 5, dude: 'test' };
    const finish = { a: 'test', b: 5, bad: '5' };
    expect(D(start, A)).to.deep.equal(finish);
  });

  context('autoserializeAs', () => {
    it('simple', () => {
      const b = new B();
      b.as.push(new A());

      expect(S(b, B)).to.deep.equal({
        as: [
          {
            a: 'test',
            b: 5,
          },
        ],
      });

      expect(D(S(b, B), B)).to.deep.eq(b);
    });

    it('recursive', () => {
      class AA {
        @autoserializeAs(A) public a = new A();
        public bad = '5';
      }

      class AAA {
        @autoserializeAs(AA) public aa = new AA();
        public bad = '5';
      }

      const aaa = new AAA();
      expect(S(aaa, AAA)).to.deep.equal({
        aa: {
          a: {
            a: 'test',
            b: 5,
          },
        },
      });

      expect(D(S(aaa, AAA), AAA)).to.deep.eq(aaa);
    });
  });

  context('autoserializeIndexable', () => {
    it('simple', () => {
      const c = new C();
      c.as.help = new A();

      expect(S(c, C)).to.deep.equal({
        as: {
          help: {
            a: 'test',
            b: 5,
          },
        },
      });
    });
  });

  context('inheritSerialization', () => {
    it('simple', () => {
      @inheritSerialization(A)
      class AA extends A {
        //
      }

      const aa = new AA();
      expect(S(aa, AA)).to.deep.equal({
        a: 'test',
        b: 5,
      });

      expect(D(S(aa, AA), AA)).to.deep.eq(aa);
    });
  });

  context('is', () => {
    it('simple', () => {
      class IS {
        @autoserialize public a = 1;
        @autoserialize public b = 1;
      }

      expect(is({ a: 1, b: 0 }, IS)).to.eq(true);
      expect(is({ a: '', b: 0, c: 0 }, IS)).to.eq(true);
      expect(is({ a: 1 }, IS)).to.eq(false);
    });
  });
});
