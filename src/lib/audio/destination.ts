import { ObeoNode } from '@/lib/audio/node';
import { getContext } from '@/lib/audio/global';
import { ObeoBaseContext } from '@/lib/audio/context';
import { createVolume, ObeoVolume } from '@/lib/audio/volume';

export interface ObeoDestination extends ObeoNode {
  readonly maxChannelCount: number;
  readonly volume: ObeoVolume;
}

export interface ObeoDestinationOptions {
  context: ObeoBaseContext;
}

export const getDestination = (options?: Partial<ObeoDestinationOptions>): ObeoDestination => {
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

export const destination = getDestination();
