import * as t from '@/lib/io';
import * as Audio from '@/lib/audio';
import Tone from 'tone';
import { Schedulable, SchedulableType } from '@/models/scheduled/schedulable';
import { Serializable } from '@/models/serializable';
import { Instrument } from '@/models/instrument/instrument';
import { allKeys } from '@/utils';

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
    super(i, { disableOffset: true });
    this.instrument = instrument;
    this.velocity = i.velocity === undefined ? 1 : i.velocity;
  }

  public copy() {
    return new Note(this.instrument, this.serialize());
  }

  public add(transport: Audio.Transport) {
    return transport.schedule({
      onStart: ({ seconds }) => {
        const value = allKeys[this.row].value;
        const duration = new Tone.Ticks(this.duration * Audio.Context.PPQ).toSeconds();
        this.instrument.triggerAttackRelease(value, duration, seconds, this.velocity);
      },
      time: this.time,
      duration: 0, // FIXME We shouldn't have to set a duration. This is explained more in the Transport class file.
      offset: 0,
    });
  }

  public serialize() {
    return {
      row: this.row,
      time: this.time,
      velocity: this.velocity,
      duration: this.duration,
      offset: this.offset,
    };
  }
}
