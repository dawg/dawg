import { createParam, ObeoParam } from '@/lib/audio/param';
import { ObeoNode, extractAudioNode } from '@/lib/audio/node';
import { getContext } from '@/lib/audio/global';
import { ObeoConversion } from '@/lib/audio/abstract-param';


export interface ObeoGain extends ObeoNode<GainNode> {
  readonly gain: ObeoParam;
}

export interface ObeoGainOptions {
  gain: number;
  toUnit: ObeoConversion;
  fromUnit: ObeoConversion;
}

export const createGain = (options?: Partial<ObeoGainOptions>): ObeoGain => {
  const context = getContext();
  const gain = context.createGain();

  return {
    ...extractAudioNode(gain),
    gain: createParam(gain.gain, {
      name: 'Gain',
      value: options?.gain,
      toUnit: options?.toUnit,
      fromUnit: options?.fromUnit,
    }),
  };
};
