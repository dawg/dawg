import { createGain } from '@/lib/audio/gain';
import { createParam } from '@/lib/audio/param';
import { dbToGain, gainToDb } from '@/lib/audio/conversions';

export const createVolume = () => {
  const gain = createGain();
  return Object.assign(gain, { volume: createParam(gain.gain, { toUnit: dbToGain, fromUnit: gainToDb }) });
};
