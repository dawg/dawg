import { ObeoNode, extractAudioNode } from '@/lib/audio/node';

export interface ObeoScheduledSourceNode<T extends AudioNode = AudioScheduledSourceNode> extends ObeoNode<T> {
  onended: ((this: AudioScheduledSourceNode, ev: Event) => any) | null;
  start(when?: number): void;
  stop(when?: number): void;
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
    start: node.start.bind(node),
    stop: node.stop.bind(node),
    addEventListener: node.addEventListener.bind(node),
    removeEventListener: node.removeEventListener.bind(node),
  };
};
