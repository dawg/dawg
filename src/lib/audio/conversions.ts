import { GainFactor, Decibels } from '@/lib/audio/types';

/**
 * Convert gain to decibels.
 */
export function gainToDb(gain: GainFactor): Decibels {
  return 20 * (Math.log(gain) / Math.LN10);
}

/**
 * Convert decibels into gain.
 */
export function dbToGain(db: Decibels): GainFactor {
  return Math.pow(10, db / 20);
}
