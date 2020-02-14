import * as t from '@/lib/io';
import uuid from 'uuid';
import { Instrument } from '@/models/instrument/instrument';
import { Serializable } from '@/models/serializable';
import { createNotePrototype, ScheduledNoteType, ScheduledNote } from '@/models/schedulable';
import { Transport } from '@/lib/audio';
import { Sequence } from '@/models/sequence';

const ScoreTypeRequired = t.type({
  instrumentId: t.string,
  id: t.string,
});

const ScoreTypePartial = t.partial({
  notes: t.array(ScheduledNoteType),
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
  public notes: Sequence<ScheduledNote>;

  constructor(transport: Transport, public instrument: Instrument<any, any>, i: IScore) {
    this.id = i.id;
    this.instrumentId = i.instrumentId;
    const notes = (i.notes || []).map((iNote) => {
      return createNotePrototype(iNote, this.instrument)(transport);
    });

    this.notes = new Sequence(notes);
  }

  public serialize() {
    return {
      instrumentId: this.instrumentId,
      id: this.id,
      notes: this.notes.map((note) => note.serialize()),
    };
  }

  public dispose() {
    this.notes.forEach((note) => note.removeNoHistory());
  }
}
