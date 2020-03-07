import { createGain } from '@/lib/audio/gain';
import { createParam } from '@/lib/audio/param';
import { dbToGain } from '@/lib/audio/conversions';

export const createVolume = () => {
  const gain = createGain();
  return Object.assign({ volume: createParam({ param: gain.gain, toUnit: dbToGain }) }, gain);
};
