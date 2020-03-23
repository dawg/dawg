import { createParam, ObeoParamOptions, ObeoParam } from '@/lib/audio/param';
import { ObeoNode, extractAudioNode } from '@/lib/audio/node';
import { getContext } from '@/lib/audio/global';
import { Setter, setter } from '@/lib/reactor';


export interface ObeoGain extends ObeoNode<GainNode> {
  readonly gain: ObeoParam;
  muted: Setter<boolean>;
}

export type ObeoGainOptions = ObeoParamOptions;

export const createGain = (options?: Partial<ObeoGainOptions>): ObeoGain => {
  const context = getContext();
  const gain = context.createGain();

  let unmutedValue: number | undefined;

  return {
    ...extractAudioNode(gain),
    gain: createParam(gain.gain, {
      name: 'Gain',
      ...options,
    }),
    muted: setter(
      () => unmutedValue !== undefined,
      (value) => {
        if (value && unmutedValue === undefined) {
          unmutedValue = gain.gain.value;
          gain.gain.value = -Infinity;
        } else if (!value && unmutedValue !== undefined) {
          gain.gain.value = unmutedValue;
          unmutedValue = undefined;
        }
      },
    ),
  };
};
