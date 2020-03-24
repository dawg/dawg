import { getContext } from '@/lib/audio/global';
import { extractAudioNode, ObeoNode } from '@/lib/audio/node';
import { ObeoParam, createParam, ObeoParamOptions } from '@/lib/audio/param';

export interface ObeoStereoPanner extends ObeoNode<StereoPannerNode> {
  readonly pan: ObeoParam;
}

export interface ObeoStereoPannerOptions extends ObeoParamOptions {
  channelCount: number;
}

export const createStereoPanner = (
  options?: Partial<ObeoStereoPannerOptions>,
): ObeoStereoPanner => {
  const context = getContext();
  const panner = context.createStereoPanner();

  if (options?.channelCount !== undefined) {
    panner.channelCount = options.channelCount;
  }

  return {
    ...extractAudioNode(panner),
    pan: createParam(panner.pan, { ...options, name: 'ObeoStereoPanner' }),
  };
};
