import { createGain } from '@/lib/audio/gain';
import { dbToGain, gainToDb } from '@/lib/audio/conversions';
import { ObeoParam } from '@/lib/audio/param';
import { ObeoNode } from '@/lib/audio/node';

export interface ObeoVolumeNode extends ObeoNode {
  readonly volume: ObeoParam;
  mute: (value: boolean) => void;
}

export const createVolume = (): ObeoVolumeNode => {
  const gain = createGain({ toUnit: dbToGain, fromUnit: gainToDb });
  return {
    ...gain,
    volume: gain.gain,
  };
};
