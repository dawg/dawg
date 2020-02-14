import * as t from '@/lib/io';
import * as Audio from '@/lib/audio';
import { SchedulableType, Schedulable } from '@/models/scheduled/schedulable';
import { Serializable } from '@/models/serializable';
import { Sample } from '@/models/sample';
import { literal } from '@/lib/std';
import { Context } from '@/lib/audio/context';

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
      offset: 0,
    });
  }

  public sampleId: string;
  public readonly component = 'sample-element';
  public sample: Sample;
  protected sliceMode = literal('offset');

  constructor(sample: Sample, i: IScheduledSample) {
    super(i);
    this.sample = sample;
    this.sampleId = i.sampleId;
  }

  public copy() {
    return new ScheduledSample(this.sample, this.serialize());
  }

  public serialize() {
    return {
      row: this.row,
      duration: this.duration,
      time: this.time,
      type: literal('sample'),
      sampleId: this.sampleId,
      offset: this.offset,
    };
  }

  protected add(transport: Audio.Transport) {
    if (!this.sample.player) {
      return;
    }

    const instance = this.sample.player.createInstance();
    let controller: { stop: (seconds: Audio.ContextTime) => void } | null = null;
    return transport.schedule({
      time: this.time,
      duration: this.duration,
      offset: 0,
      onStart: ({ seconds }) => {
        controller = instance.start({
          startTime: seconds,
          offset: this.offset,
          duration: Context.beatsToSeconds(this.duration),
        });
      },
      onMidStart: ({ seconds, secondsOffset }) => {
        controller = instance.start({
          startTime: seconds,
          offset: secondsOffset,
          duration: Context.beatsToSeconds(this.duration),
        });
      },
      onEnd: ({ seconds }) => {
        // `controller` should never be null but we need to satisfy TypeScript
        // If, for some reason, it is null, then we don't really care about calling stop
        if (controller) {
          controller.stop(seconds);
        }
      },
    });
  }
}
