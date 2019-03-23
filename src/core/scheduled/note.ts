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
  public instrument: Instrument<any>;

  constructor(instrument: Instrument<any>, i: INote) {
    super(i);
    this.instrument = instrument;
    this.velocity = i.velocity === undefined ? 1 : i.velocity;
  }

  public copy() {
    return new Note(this.instrument, this.serialize());
  }

  public add(transport: Audio.Transport) {
    return transport.schedule((exact: number) => {
      const duration = toTickTime(this.duration);
      const value = allKeys[this.row].value;
      this.instrument.triggerAttackRelease(value, duration, exact, this.velocity);
    }, this.tickTime);
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
