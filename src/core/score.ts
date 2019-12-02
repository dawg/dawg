import * as t from '@/modules/io';
import uuid from 'uuid';
import { Instrument } from '@/core/instrument/instrument';
import { Serializable } from '@/core/serializable';
import { Note, NoteType } from '@/core/scheduled/note';
import { Transport } from '@/modules/audio';
import { Sequence } from '@/core/scheduled/sequence';

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
  public static create(transport: Transport, instrument: Instrument<any, any>) {
    const score = new Score(transport, instrument, {
      id: uuid.v4(),
      instrumentId: instrument.id,
    });
    return score;
  }
  public id: string;
  public instrumentId: string;
  public notes: Sequence<Note>;

  constructor(transport: Transport, public instrument: Instrument<any, any>, i: IScore) {
    this.id = i.id;
    this.instrumentId = i.instrumentId;
    const notes = (i.notes || []).map((iNote) => {
      return new Note(this.instrument, iNote);
    });

    this.notes = new Sequence(transport, notes);
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
