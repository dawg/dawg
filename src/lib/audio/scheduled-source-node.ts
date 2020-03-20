import { ObeoNode, extractAudioNode } from '@/lib/audio/node';
import { ContextTime } from '@/lib/audio/types';

// TODO make the soundfont use this too!!
export interface Stopper {
  stop: (when?: ContextTime) => void;
}

export interface ObeoScheduledSourceNode<T extends AudioNode = AudioScheduledSourceNode> extends ObeoNode<T> {
  start(when?: number): Stopper;
}

export const extractAudioScheduledSourceNode = (node: AudioScheduledSourceNode): ObeoScheduledSourceNode => {
  // TODO properties ??
  return {
    ...extractAudioNode(node),
    start: (when) => {
      node.start(when);
      return {
        stop: node.stop.bind(node),
      };
    },
  };
};
