import { context } from '@/lib/audio/online';
import { createParam, ObeoParamOptions, ObeoParam } from '@/lib/audio/param';
import { ObeoNode, extractAudioNode } from '@/lib/audio/node';


export interface ObeoGainNode extends ObeoNode<GainNode> {
  readonly gain: ObeoParam;
  mute: (value: boolean) => void;
}

// tslint:disable-next-line:no-empty-interface
export interface GainInterface extends ObeoParamOptions {
  //
}

export const createGain = (options?: Partial<GainInterface>): ObeoGainNode => {
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

  return {
    ...extractAudioNode(gain),
    gain: createParam(gain.gain, {
      ...options,
      name: 'Gain',
    }),
    mute,
  };
};
