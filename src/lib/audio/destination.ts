import { extractAudioNode, ObeoNode } from '@/lib/audio/node';
import { getContext } from '@/lib/audio/global';
import { ObeoBaseContext } from '@/lib/audio/context';

export interface ObeoDestination extends ObeoNode {
  readonly maxChannelCount: number;
}

export interface ObeoDestinationOptions {
  context: ObeoBaseContext;
}

export const createDestination = (options?: Partial<ObeoDestinationOptions>): ObeoDestination => {
  const context = options?.context ?? getContext();
  const internal = context.destination;

  return {
    ...extractAudioNode(internal),
    maxChannelCount: internal.maxChannelCount,
  };
};

export const destination = createDestination();
