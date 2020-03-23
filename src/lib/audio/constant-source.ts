import { createParam, ObeoParam } from '@/lib/audio/param';
import { ObeoScheduledSourceNode, extractAudioScheduledSourceNode } from '@/lib/audio/scheduled-source-node';
import { getContext } from '@/lib/audio/global';

export interface ObeoConstantSource extends ObeoScheduledSourceNode {
  readonly offset: ObeoParam;
}

export interface ObeoConstantSourceOptions {
  value: number;
  name: string;
}

// Enhances the "offset" param
// See https://developer.mozilla.org/en-US/docs/Web/API/ConstantSourceNode
export const createConstantSource = (options?: Partial<ObeoConstantSourceOptions>): ObeoConstantSource => {
  const context = getContext();
  const source = context.createConstantSource();
  const offset = createParam(source.offset, options);
  return {
    ...extractAudioScheduledSourceNode(source),
    offset,
  };
};
