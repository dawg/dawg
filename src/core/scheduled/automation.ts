import * as t from 'io-ts';
import { AutomationClip } from '@/core/automation';
import * as Audio from '@/modules/audio';
import { Schedulable, SchedulableType } from '@/core/scheduled/schedulable';
import { Serializable } from '../serializable';
import { toTickTime, literal } from '@/utils';

export const ScheduledAutomationType = t.intersection([
  t.type({
    automationId: t.string,
    type: t.literal('automation'),
  }),
  SchedulableType,
]);

export type IScheduledAutomation = t.TypeOf<typeof ScheduledAutomationType>;

export class ScheduledAutomation extends Schedulable implements Serializable<IScheduledAutomation> {
  public static create(clip: AutomationClip, time: number, row: number, duration: number) {
    return new ScheduledAutomation(clip, {
      time,
      row,
      type: 'automation',
      duration,
      automationId: clip.id,
    });
  }

  public readonly component = 'automation-clip-element';
  public automationId: string;

  constructor(public clip: AutomationClip, i: IScheduledAutomation) {
    super(i);
    this.automationId = i.automationId;
  }

  public copy() {
    return new ScheduledAutomation(this.clip, this.serialize());
  }

  public serialize() {
    return {
      time: this.time,
      row: this.row,
      type: literal('automation'),
      duration: this.duration,
      automationId: this.automationId,
    };
  }

  protected add(transport: Audio.Transport) {
    return this.clip.control.sync(transport, this.tickTime, toTickTime(this.duration));
  }
}
