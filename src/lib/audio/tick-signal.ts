import { getContext } from '@/lib/audio/global';
import { createTickParam, ObeoTickParam, ObeoTickParamOptions } from '@/lib/audio/tick-param';
import { extractAudioNode, ObeoNode } from '@/lib/audio/node';

export interface ObeoTickSignal extends ObeoNode<ConstantSourceNode> {
  readonly offset: ObeoTickParam;
  dispose(): void;
}

export type ObeoTickSignalOptions = ObeoTickParamOptions;

export const createTickSignal = (options?: Partial<ObeoTickSignalOptions>): ObeoTickSignal => {
  const context = getContext();

  // A bit of duplicate logic here with "createConstantSource" and "createSignal"
  const source = context.createConstantSource();
  const offset = createTickParam(source.offset, options);
  source.start(0);

  return {
    ...extractAudioNode(source),
    offset,
    dispose: () => {
      source.stop();
      source.disconnect();
      offset.dispose();
    },
  };
};
