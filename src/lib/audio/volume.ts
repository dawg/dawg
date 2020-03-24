import { createGain } from '@/lib/audio/gain';
import { dbToGain, gainToDb } from '@/lib/audio/util';
import { ObeoParam } from '@/lib/audio/param';
import { ObeoNode } from '@/lib/audio/node';
import { Setter, setter } from '@/lib/reactor';

export interface ObeoVolume extends ObeoNode<GainNode> {
  readonly volume: ObeoParam;
  readonly muted: Setter<boolean>;
}

export interface ObeoVolumeOptions {
  volume: number;
  muted: boolean;
}

export const createVolume = (options?: Partial<ObeoVolumeOptions>): ObeoVolume => {
  const gain = createGain({
    toUnit: gainToDb,
    fromUnit: dbToGain,
    gain: options?.volume,
  });

  let unmutedValue: number | undefined;
  const muted =  setter(
    () => gain.gain.value === -Infinity,
    (value) => {
      if (value && unmutedValue === undefined) {
        unmutedValue = gain.gain.value;
        gain.gain.value = -Infinity;
      } else if (!value && unmutedValue !== undefined) {
        gain.gain.value = unmutedValue;
        unmutedValue = undefined;
      }
    },
  );

  if (options?.muted !== undefined) {
    muted.value = options.muted;
  }

  return {
    ...gain,
    muted,
    volume: gain.gain,
  };
};
