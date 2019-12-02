import * as t from 'io-ts';
import * as Audio from '@/modules/audio';
import { Schedulable, SchedulableType } from '@/core/scheduled/schedulable';
import { Serializable } from '@/core/serializable';
import { Instrument } from '@/core/instrument/instrument';
import { allKeys, toTickTime } from '@/utils';

export const NoteType = t.intersection([
  t.partial({
    velocity: t.number,
  }),
  SchedulableType,
]);

export type INote = t.TypeOf<typeof NoteType>;

export class Note extends Schedulable implements Serializable<INote> {
  public velocity: number;
  public readonly component = 'note';
  public instrument: Instrument<any, any>;

  constructor(instrument: Instrument<any, any>, i: INote) {
    super(i);
    this.instrument = instrument;
    this.velocity = i.velocity === undefined ? 1 : i.velocity;
  }

  public copy() {
    return new Note(this.instrument, this.serialize());
  }

  public add(transport: Audio.Transport) {
    return transport.schedule({
      onStart: ({ seconds }) => {
        const duration = toTickTime(this.duration);
        const value = allKeys[this.row].value;
        this.instrument.triggerAttackRelease(value, duration, seconds, this.velocity);
      },
      time: this.time,
      duration: 0, // FIXME We shouldn't have to set a duration. This is explained more in the Transport class file.
    });
  }

  public serialize() {
    return {
      row: this.row,
      time: this.time,
      velocity: this.velocity,
      duration: this.duration,
    };
  }
}
