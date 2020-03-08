import { context } from '@/lib/audio/online';

export interface GainInterface {
  gain?: number;
}

export const createGain = (options?: Partial<GainInterface>) => {
  const gain = context.createGain();
  gain.gain.value = options?.gain ?? gain.gain.defaultValue;

  let unmutedValue: number | undefined;
  const mute = (value: boolean) => {
    if (value && unmutedValue === undefined) {
      unmutedValue = gain.gain.value;
      gain.gain.value = -Infinity;
    } else if (!value && unmutedValue !== undefined) {
      gain.gain.value = unmutedValue;
      unmutedValue = undefined;
    }
  };

  return Object.assign(gain, { mute });
};
