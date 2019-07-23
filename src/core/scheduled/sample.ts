import * as t from 'io-ts';
import * as Audio from '@/modules/audio';
import { SchedulableType, Schedulable } from '@/core/scheduled/schedulable';
import { Serializable } from '@/core/serializable';
import { Sample } from '@/core/sample';
import { literal, toTickTime } from '@/utils';

export const ScheduledSampleType = t.intersection([
  t.type({
    sampleId: t.string,
    type: t.literal('sample'),
  }),
  SchedulableType,
]);

export type IScheduledSample = t.TypeOf<typeof ScheduledSampleType>;

export class ScheduledSample extends Schedulable implements Serializable<IScheduledSample> {
  public static create(sample: Sample) {
    return new ScheduledSample(sample, {
      sampleId: sample.id,
      row: 0,
      time: 0,
      duration: sample.beats,
      type: 'sample',
    });
  }

  public sampleId: string;
  public readonly component = 'sample-element';
  public sample: Sample;

  constructor(sample: Sample, i: IScheduledSample) {
    super(i);
    this.sample = sample;
    this.sampleId = i.sampleId;
  }

  get sampleDuration() {
    return this.sample.beats;
  }

  public copy() {
    return new ScheduledSample(this.sample, this.serialize());
  }

  public init(sample: Sample) {
    this.sample = sample;
  }

  public serialize() {
    return {
      row: this.row,
      duration: this.duration,
      time: this.time,
      type: literal('sample'),
      sampleId: this.sampleId,
    };
  }

  protected updateDuration(duration: number) {
    if (this.sample && this.sample.player) {
      this.sample.player.setDuration(toTickTime(duration));
    }
  }

  protected add(transport: Audio.Transport) {
    if (!this.sample.player) {
      return null;
    }

    const duration = toTickTime(this.duration);
    return this.sample.player.sync(transport, this.tickTime, 0, duration);
  }
}
