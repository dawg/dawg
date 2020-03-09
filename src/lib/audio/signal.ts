import {
  ObeoConstantSourceNode,
  ObeoConstantSourceOptions,
  createConstantSource,
} from '@/lib/audio/constant-source';

export type ObeoSignalNode = ObeoConstantSourceNode;

export type ObeoSignalOptions = ObeoConstantSourceOptions;

export const createSignal = (options?: Partial<ObeoSignalOptions>): ObeoSignalNode => {
  const source = createConstantSource(options);
  source.start(0);
  return source;
};
