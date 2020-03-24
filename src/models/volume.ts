import * as Audio from '@/lib/audio';

const CONVERSION_LOG = 5;
const CONVERSION_FACTOR = 25;

/**
 * Convert a percentage from a knob or slider to .
 *
 * @param percentage The percentage (from 0 to 1).
 */
export const percentageToGain = (percentage: Audio.NormalRange): Audio.GainFactor => {
  return CONVERSION_FACTOR * Math.log(percentage) / Math.log(CONVERSION_LOG);
};

/**
 * Convert from gain to a percentage.
 *
 * @param gain The gain. Must not exceed 0.
 */
export const gainToPercentage = (gain: Audio.GainFactor): Audio.NormalRange => {
  return Math.pow(Math.E, gain * Math.log(CONVERSION_LOG) / CONVERSION_FACTOR);
};
