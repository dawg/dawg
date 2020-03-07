import { context } from '@/lib/audio/context';

export const createGain = () => {
  const gain = context.createGain();

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
