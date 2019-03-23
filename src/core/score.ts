import * as t from 'io-ts';
import uuid from 'uuid';
import { Instrument } from '@/core/instrument/instrument';
import { Serializable } from './serializable';
import { Note, NoteType } from './scheduled/note';

const ScoreTypeRequired = t.type({
  instrumentId: t.string,
  id: t.string,
});

const ScoreTypePartial = t.partial({
  notes: t.array(NoteType),
});

export const ScoreType = t.intersection([ScoreTypeRequired, ScoreTypePartial]);

export type IScore = t.TypeOf<typeof ScoreType>;

export class Score implements Serializable<IScore> {
  public static create(instrument: Instrument<any>) {
    const score = new Score(instrument, {
      id: uuid.v4(),
      instrumentId: instrument.id,
    });
    return score;
  }
  public id: string;
  public instrumentId: string;
  public notes: Note[];

  constructor(public instrument: Instrument<any>, i: IScore) {
    this.id = i.id;
    this.instrumentId = i.instrumentId;
    this.notes = (i.notes || []).map((iNote) => {
      return new Note(this.instrument, iNote);
    });
  }

  public serialize() {
    return {
      instrumentId: this.instrumentId,
      id: this.id,
      notes: this.notes.map((note) => note.serialize()),
    };
  }

  public dispose() {
    this.notes.forEach((note) => note.dispose());
  }
}
