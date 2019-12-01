import * as t from 'io-ts';
import * as Audio from '@/modules/audio';
import { ScheduledPattern, ScheduledPatternType } from '@/core/scheduled/pattern';
import { ScheduledSample, ScheduledSampleType } from '@/core/scheduled/sample';
import { ScheduledAutomation, ScheduledAutomationType } from '@/core/scheduled/automation';
import { Serializable } from '@/core/serializable';
import { Sequence } from '@/core/scheduled/sequence';

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
type PlaylistElements = ScheduledPattern | ScheduledSample | ScheduledAutomation;

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
