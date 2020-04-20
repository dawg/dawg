import { ObeoNode, mimicAudioNode } from '@/lib/audio/node';
import { ContextTime } from '@/lib/audio/types';

// TODO make the soundfont use this too!!
export interface ObeoScheduledSourceStopper {
  /**
   * Stop the source node at the given time.
   * @param time When to stop the source
   */
  stop: (when?: ContextTime) => void;
}

export interface ObeoScheduledSourceNode<
  O extends AudioNode = AudioScheduledSourceNode
> extends ObeoNode<O, undefined> {
  start(when?: number): ObeoScheduledSourceStopper;
}

export const extractAudioScheduledSourceNode = (
  node: AudioScheduledSourceNode,
): ObeoScheduledSourceNode => {
  return {
    ...mimicAudioNode(undefined, node),
    start: (when) => {
      node.start(when);
      return {
        stop: node.stop.bind(node),
      };
    },
  };
};
