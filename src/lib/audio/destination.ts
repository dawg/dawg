import { ObeoNode } from '@/lib/audio/node';
import { getContext } from '@/lib/audio/global';
import { ObeoBaseContext } from '@/lib/audio/context';
import { createVolume, ObeoVolumeNode } from '@/lib/audio/volume';

export interface ObeoDestination extends ObeoNode {
  readonly maxChannelCount: number;
  readonly volume: ObeoVolumeNode;
}

export interface ObeoDestinationOptions {
  context: ObeoBaseContext;
}

// TODO move to node file and add better API
export const createDestination = (options?: Partial<ObeoDestinationOptions>): ObeoDestination => {
  const context = options?.context ?? getContext();
  const internal = context.destination;

  const volume = createVolume();
  volume.output.connect(internal);

  return {
    ...volume,
    volume,
    maxChannelCount: internal.maxChannelCount,
  };
};

export const destination = createDestination();
