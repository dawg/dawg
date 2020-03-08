import { context } from '@/lib/audio/online';
import { extractAudioNode, ObeoNode } from '@/lib/audio/node';

export interface ObeoDestination extends ObeoNode {
  readonly maxChannelCount: number;
}

export const createDestination = (): ObeoDestination => {
  const internal = context.destination;

  return {
    ...extractAudioNode(internal),
    maxChannelCount: internal.maxChannelCount,
  };
};

export const destination = createDestination();
