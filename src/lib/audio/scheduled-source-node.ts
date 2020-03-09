import { ObeoNode, extractAudioNode } from '@/lib/audio/node';
import { ContextTime } from '@/lib/audio/types';

export interface Stopper {
  stop: (when?: ContextTime) => void;
}

export interface ObeoScheduledSourceNode<T extends AudioNode = AudioScheduledSourceNode> extends ObeoNode<T> {
  onended: ((this: AudioScheduledSourceNode, ev: Event) => any) | null;
  start(when?: number): Stopper;
  addEventListener<K extends keyof AudioScheduledSourceNodeEventMap>(
    type: K,
    listener: (this: AudioScheduledSourceNode, ev: AudioScheduledSourceNodeEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener<K extends keyof AudioScheduledSourceNodeEventMap>(
    type: K,
    listener: (this: AudioScheduledSourceNode, ev: AudioScheduledSourceNodeEventMap[K]) => any,
    options?: boolean | EventListenerOptions,
  ): void;
}

export const extractAudioScheduledSourceNode = (node: AudioScheduledSourceNode): ObeoScheduledSourceNode => {
  // TODO properties ??
  return {
    ...extractAudioNode(node),
    onended: node.onended,
    start: (when) => {
      node.start(when);
      return {
        stop: node.stop.bind(node),
      };
    },
    addEventListener: node.addEventListener.bind(node),
    removeEventListener: node.removeEventListener.bind(node),
  };
};
