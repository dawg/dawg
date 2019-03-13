import { deserialize, serialize } from '@/modules/cerialize';
import { expect } from 'chai';
import { Note, Pattern, Score, Instrument } from './schemas';

describe('schemas', () => {
  context('Note', () => {
    it('works', () => {
      const noteObject = {
        row: 0,
        duration: 5,
        time: 5,
      };
      const note = new Note(noteObject);
      const serialized = serialize(note, Note);
      expect(deserialize(serialized, Note)).to.deep.eq(note);
    });
  });

  context('Score', () => {
    it('works', () => {
      const instrument = Instrument.default('asdfs');
      const score = Score.create(instrument);
      score.notes.push(new Note({row: 0, duration: 5, time: 5}));
      const serialized = serialize(score, Score);
      const deserialized = deserialize(serialized, Score);
      deserialized.init(instrument);
      expect(deserialized).to.deep.eq(score);
    });
  });

  context('Pattern', () => {
    it('works', () => {
      const score = Score.create(Instrument.default('lksdfj'));
      score.notes.push(new Note({row: 0, duration: 5, time: 5}));
      const pattern = Pattern.create('PAT');
      pattern.scores.push(score);
      const recreated = deserialize(serialize(pattern, Pattern), Pattern);
      expect(serialize(recreated, Pattern)).to.deep.eq(serialize(pattern, Pattern));
    });
  });

  context('Instrument', () => {
    it('works', () => {
      const instrument = Instrument.create({ name: 'IN', pan: 0.5, volume: 1, type: 'sine', mute: true });
      const recreated = deserialize(serialize(instrument, Instrument), Instrument);
      expect(serialize(instrument, Instrument)).to.deep.eq(serialize(recreated, Instrument));
    });
  });
});
