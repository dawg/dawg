import { getContext } from '@/lib/audio/global';
import { ObeoNode, extractAudioNode } from '@/lib/audio/node';
import { Setter, setter } from '@/lib/reactor';

type Mapper = (value: number) => number;

export interface ObeoWaveShaper extends ObeoNode<WaveShaperNode> {
  readonly oversample: Setter<OverSampleType>;
  setMap(mapper: Mapper): void;
}

export interface ObeoWaveShaperOptions {
  length: number;
  mapping: Mapper;
}

export const createWaveShaper = (options?: Partial<ObeoWaveShaperOptions>): ObeoWaveShaper => {
  const length = options?.length ?? 1024;
  const context = getContext();
  const shaper = context.createWaveShaper();

  const setMap = (mapping: Mapper) => {
    const curve = new Float32Array(length);
    for (let i = 0, len = length; i < len; i++) {
      // e.g. length = 11, i = 0 -> 10, normalized = -1, -0.8, ..., 0.8, 1
      const normalized = (i / (len - 1)) * 2 - 1;
      curve[i] = mapping(normalized);
    }
    shaper.curve = curve;
  };

  if (options?.mapping) {
    setMap(options.mapping);
  }

  const oversample = setter(() => shaper.oversample, (value) => shaper.oversample = value);

  return {
    ...extractAudioNode(shaper),
    oversample,
    setMap,
  };
};
