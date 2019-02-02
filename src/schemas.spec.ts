import { Serialize, Deserialize, autoserializeAs, deserialize, autoserialize } from 'cerialize';
import { expect } from 'chai';
import { Note, Pattern, Score, Instrument } from './schemas';

describe('schemas', () => {
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

  context('Note', () => {
    it('works', () => {
      const noteObject = {
        row: 0,
        duration: 5,
        time: 5,
      };
      const note = new Note(noteObject);
      const serialized = Serialize(note);
      expect(Deserialize(serialized, Note)).to.deep.eq(note);
    });
  });

  context('Score', () => {
    it('works', () => {
      const instrument = Instrument.default('asdfs');
      const score = Score.create(instrument);
      score.notes.push(new Note({row: 0, duration: 5, time: 5}));
      const serialized = Serialize(score, Score);
      const deserialized = Deserialize(serialized, Score);
      deserialized.init({ [instrument.id]: instrument });
      expect(deserialized).to.deep.eq(score);
    });
  });

  context('Pattern', () => {
    it('works', () => {
      const score = Score.create(Instrument.default('lksdfj'));
      score.notes.push(new Note({row: 0, duration: 5, time: 5}));
      const pattern = Pattern.create('PAT');
      pattern.scores.push(score);
      const recreated = Deserialize(Serialize(pattern, Pattern));
      expect(Serialize(recreated, Pattern)).to.deep.eq(Serialize(pattern, Pattern));
    });
  });

  context('Instrument', () => {
    it('works', () => {
      const instrument = Instrument.create({ name: 'IN', pan: 0.5, volume: 1, type: 'sine', mute: true });
      const recreated = Deserialize(Serialize(instrument, Instrument));
      expect(Serialize(instrument, Instrument)).to.deep.eq(Serialize(recreated));
    });
  });
});
