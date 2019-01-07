import { Serialize, Deserialize, autoserializeAs } from 'cerialize';
import { expect } from 'chai';
import { Note, Score, Pattern, Instrument, Project } from './schemas';

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
        id: 0,
        duration: 5,
        time: 5,
      };
      const note = Note.create(noteObject);
      const serialized = Serialize(note);
      expect(serialized).to.deep.eq(note);
      expect(Deserialize(serialized, Note)).to.deep.eq(note);
    });
  });

  context('Score', () => {
    it('works', () => {
      const score = Score.create('instr');
      score.notes.push(Note.create({id: 0, duration: 5, time: 5}));
      expect(Deserialize(Serialize(score, Score))).to.deep.eq(score);
    });
  });

  context('Pattern', () => {
    it('works', () => {
      const score = Score.create('instr');
      score.notes.push(Note.create({id: 0, duration: 5, time: 5}));
      const pattern = Pattern.create('PAT');
      pattern.scores.push(score);
      expect(Deserialize(Serialize(pattern, Pattern))).to.deep.eq(pattern);
    });
  });

  context('Instrument', () => {
    it('works', () => {
      const instrument = Instrument.create({name: 'IN', pan: 0.5, volume: 1, type: 'sine' });
      const serialized = Deserialize(Serialize(instrument, Instrument));
      const recreated = Deserialize(Serialize(instrument, Instrument));
      expect(serialized).to.deep.eq(Serialize(recreated));
    });
  });
});
