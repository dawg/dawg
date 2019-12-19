import * as t from '@/modules/io';
import * as Audio from '@/modules/audio';
import { SchedulableType, Schedulable } from '@/core/scheduled/schedulable';
import { Serializable } from '@/core/serializable';
import { Sample } from '@/core/sample';
import { literal } from '@/utils';
import { Context } from '@/modules/audio/context';

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

  protected add(transport: Audio.Transport) {
    if (!this.sample.player) {
      return;
    }

    const player = this.sample.player;
    let controller: { stop: (seconds: Audio.ContextTime) => void } | null = null;
    return transport.schedule({
      time: this.time,
      duration: this.duration,
      onStart: ({ seconds }) => {
        controller = player.start({
          startTime: seconds,
          offset: 0,
          duration: Context.beatsToSeconds(this.duration),
        });
      },
      onMidStart: ({ seconds, secondsOffset }) => {
        controller = player.start({
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
