import * as t from '@/lib/io';
import uuid from 'uuid';
import { Instrument } from '@/models/instrument';
import { Serializable } from '@/models/serializable';
import { createNotePrototype, ScheduledNoteType, ScheduledNote, watchOlyArray } from '@/models/schedulable';
import * as oly from '@/lib/olyger';
import * as Audio from '@/lib/audio';

export const ScoreType = t.type({
  instrumentId: t.string,
  id: t.string,
  notes: t.array(ScheduledNoteType),
});

export type IScore = t.TypeOf<typeof ScoreType>;

export class Score implements Serializable<IScore> {
  public static create(transport: Audio.ObeoTransport, instrument: Instrument) {
    const score = new Score(transport, instrument, {
      id: uuid.v4(),
      instrumentId: instrument.id,
      notes: [],
    });
    return score;
  }
  public id: string;
  public instrumentId: string;
  public notes: ScheduledNote[];

  constructor(transport: Audio.ObeoTransport, public instrument: Instrument<any, any>, i: IScore) {
    this.id = i.id;
    this.instrumentId = i.instrumentId;
    const notes = oly.olyArr(i.notes.map((iNote) => {
      return createNotePrototype(iNote, this.instrument, { velocity: iNote.velocity })(transport).copy();
    }), 'Note');

    this.notes = watchOlyArray(notes);
  }

  public serialize() {
    return {
      instrumentId: this.instrumentId,
      id: this.id,
      notes: this.notes.map((note) => note.serialize()),
    };
  }
}
