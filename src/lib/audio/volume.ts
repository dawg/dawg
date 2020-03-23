import { createGain } from '@/lib/audio/gain';
import { dbToGain, gainToDb } from '@/lib/audio/util';
import { ObeoParam } from '@/lib/audio/param';
import { ObeoNode } from '@/lib/audio/node';
import { Setter } from '@/lib/reactor';

export interface ObeoVolumeNode extends ObeoNode<GainNode> {
  readonly volume: ObeoParam;
  readonly muted: Setter<boolean>;
}

export const createVolume = (): ObeoVolumeNode => {
  const gain = createGain({ toUnit: gainToDb, fromUnit: dbToGain });
  return {
    ...gain,
    volume: gain.gain,
  };
};
