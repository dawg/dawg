import * as t from '@/lib/io';
import * as Audio from '@/lib/audio';
import { SchedulableType, Schedulable } from '@/models/scheduled/schedulable';
import { Pattern } from '@/models/pattern';
import { Serializable } from '@/models/serializable';
import { literal } from '@/lib/std';

export const ScheduledPatternType = t.intersection([
  t.type({
    patternId: t.string,
    type: t.literal('pattern'),
  }),
  SchedulableType,
]);

export type IScheduledPattern = t.TypeOf<typeof ScheduledPatternType>;

export class ScheduledPattern extends Schedulable implements Serializable<IScheduledPattern> {
  public static create(pattern: Pattern) {
    return new ScheduledPattern(pattern, {
      duration: pattern.duration,
      patternId: pattern.id,
      type: 'pattern',
      row: 0,
      time: 0,
      offset: 0,
    });
  }

  public readonly component = 'pattern-element';
  public patternId: string;
  protected sliceMode = literal('offset');

  constructor(public pattern: Pattern, i: IScheduledPattern) {
    super(i);
    this.patternId = i.patternId;
  }

  public init(pattern: Pattern) {
    this.pattern = pattern;
  }

  public copy() {
    return new ScheduledPattern(this.pattern, this.serialize());
  }

  public serialize() {
    return {
      row: this.row,
      duration: this.duration,
      time: this.time,
      patternId: this.patternId,
      type: literal('pattern'),
      offset: this.offset,
    };
  }

  protected add(transport: Audio.Transport) {
    return transport.embed(this.pattern.transport, this.time, this.duration);
  }
}
