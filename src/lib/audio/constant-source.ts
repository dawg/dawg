import { context } from '@/lib/audio/online';
import { createParam, ObeoParam } from '@/lib/audio/param';
import { ObeoScheduledSourceNode, extractAudioScheduledSourceNode } from '@/lib/audio/scheduled-source-node';

export interface ObeoConstantSourceNode extends ObeoScheduledSourceNode {
  readonly offset: ObeoParam;
}

export interface ConstantSourceOptions {
  value: number;
  name: string;
}

// Enhances the "offset" param
// See https://developer.mozilla.org/en-US/docs/Web/API/ConstantSourceNode
export const createConstantSource = (options?: Partial<ConstantSourceOptions>): ObeoConstantSourceNode => {
  const source = context.createConstantSource();

  const offset = createParam(source.offset, options);

  return {
    ...extractAudioScheduledSourceNode(source),
    offset,
  };
};
