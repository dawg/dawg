import * as t from '@/lib/io';
import * as Audio from '@/lib/audio';
import { ScheduledPattern, ScheduledPatternType } from '@/models/schedulable';
import { ScheduledSample, ScheduledSampleType } from '@/models/schedulable';
import { ScheduledAutomation, ScheduledAutomationType, watchOlyArray } from '@/models/schedulable';
import { Serializable } from '@/models/serializable';
import * as oly from '@/lib/olyger';

export const PlaylistType = t.type({
  elements: t.array(t.union([
    ScheduledPatternType,
    ScheduledSampleType,
    ScheduledAutomationType,
  ])),
});

export type IPlaylist = t.TypeOf<typeof PlaylistType>;

/**
 * The possible elements that can be scheduled on a playlist.
 */
export type PlaylistElements = ScheduledPattern | ScheduledSample | ScheduledAutomation;

export type PlaylistElementType = PlaylistElements['type'];

export interface PlaylistElementLookup {
  pattern: ScheduledPattern;
  sample: ScheduledSample;
  automation: ScheduledAutomation;
}

export class Playlist implements Serializable<IPlaylist> {
  /**
   * The elements currently scheduled on the transport.
   */
  public elements: PlaylistElements[];

  constructor(public transport: Audio.Transport, elements: PlaylistElements[]) {
    this.elements = watchOlyArray(oly.olyArr(elements, 'Playlist Element'));
  }

  public serialize() {
    return {
      elements: this.elements.map((element) => element.serialize()),
    };
  }
}
