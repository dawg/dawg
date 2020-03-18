// TODO test

import { getContext } from '@/lib/audio/global';
import { extractAudioNode } from '@/lib/audio/node';
import { ObeoParam, createParam, ObeoParamOptions } from '@/lib/audio/param';

export interface ObeoStereoPanner {
  readonly pan: ObeoParam;
}

export type ObeoStereoPannerOptions = ObeoParamOptions;

export const createStereoPanner = (options?: Partial<ObeoStereoPannerOptions>) => {
  const context = getContext();
  const panner = context.createStereoPanner();

  return {
    ...extractAudioNode(panner),
    pan: createParam(panner.pan, { ...options, name: 'ObeoStereoPanner' }),
  };
};
