import * as t from '@/lib/io';
import * as Audio from '@/lib/audio';
import { ScheduledPattern, ScheduledPatternType } from '@/models/schedulable';
import { ScheduledSample, ScheduledSampleType } from '@/models/schedulable';
import { ScheduledAutomation, ScheduledAutomationType } from '@/models/schedulable';
import { Serializable } from '@/models/serializable';
import { Sequence, createSequence } from '@/models/sequence';

export const PlaylistType = t.partial({
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

export class Playlist implements Serializable<IPlaylist> {
  /**
   * The elements currently scheduled on the transport.
   */
  public elements: Sequence<PlaylistElements>;

  constructor(public transport: Audio.Transport, elements: PlaylistElements[]) {
    this.elements = createSequence(elements);
  }

  public serialize() {
    return {
      elements: this.elements.l.map((element) => element.serialize()),
    };
  }
}
