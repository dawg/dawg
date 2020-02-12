import * as t from '@/lib/io';
import * as Audio from '@/lib/audio';
import { ScheduledPattern, ScheduledPatternType } from '@/models/scheduled/pattern';
import { ScheduledSample, ScheduledSampleType } from '@/models/scheduled/sample';
import { ScheduledAutomation, ScheduledAutomationType } from '@/models/scheduled/automation';
import { Serializable } from '@/models/serializable';
import { Sequence } from '@/models/scheduled/sequence';

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

  /**
   * The master transport.
   */
  public transport = new Audio.Transport();

  constructor(elements: PlaylistElements[]) {
    this.elements = new Sequence(this.transport, elements);
    this.elements.forEach((element) => {
      element.schedule(this.transport);
    });
  }

  public serialize() {
    return {
      elements: this.elements.map((element) => element.serialize()),
    };
  }
}
