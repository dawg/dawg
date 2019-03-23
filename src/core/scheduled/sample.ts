import * as t from 'io-ts';
import * as Audio from '@/modules/audio';
import { SchedulableType, Schedulable } from './schedulable';
import { Serializable } from '../serializable';
import { Sample } from '@/core/sample';
import { literal } from '@/utils';

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
      duration: 0,
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

  protected add(transport: Audio.Transport) {
    if (!this.sample.player) {
      return null;
    }

    return this.sample.player.sync(transport, this.tickTime, undefined, this.duration);
  }
}
