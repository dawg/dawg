import { createParam, ObeoParamOptions, ObeoParam } from '@/lib/audio/param';
import { ObeoNode, extractAudioNode } from '@/lib/audio/node';
import { getContext } from '@/lib/audio/global';
import { Setter, setter } from '@/lib/reactor';


export interface ObeoGainNode extends ObeoNode<GainNode> {
  readonly gain: ObeoParam;
  muted: Setter<boolean>;
}

// tslint:disable-next-line:no-empty-interface
export interface GainInterface extends ObeoParamOptions {
  //
}

export const createGain = (options?: Partial<GainInterface>): ObeoGainNode => {
  const context = getContext();
  const gain = context.createGain();

  let unmutedValue: number | undefined;

  return {
    ...extractAudioNode(gain),
    gain: createParam(gain.gain, {
      ...options,
      name: 'Gain',
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
