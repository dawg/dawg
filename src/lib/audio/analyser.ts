import { PowerOfTwo, NormalRange } from '@/lib/audio/types';
import { ObeoNode, extractAudioNode } from '@/lib/audio/node';
import { getContext } from '@/lib/audio/global';
import { Setter, setter } from '@/lib/reactor';

export interface ObeoAnalyser extends ObeoNode<AnalyserNode> {
  fftSize: Setter<number>;
  readonly frequencyBinCount: number;
  maxDecibels: Setter<number>;
  minDecibels: Setter<number>;
  smoothingTimeConstant: Setter<number>;
  getByteFrequencyData(array: Uint8Array): void;
  getValue(): Float32Array;
  dispose(): void;
}

export type AnalyserType = 'fft' | 'waveform';

export interface AnalyserOptions {
  size: PowerOfTwo;
  type: AnalyserType;
  smoothing: NormalRange;
}

export const createAnalyser = (opts?: Partial<AnalyserOptions>): ObeoAnalyser => {
  const context = getContext();
  const analyser = context.createAnalyser();
  const size = opts?.size ?? 1024;
  const smoothing = opts?.smoothing ?? 0.8;
  const type: AnalyserType = opts?.type ?? 'fft';
  const buffer = new Float32Array(size);

  analyser.smoothingTimeConstant = smoothing;
  analyser.fftSize = size * 2;

  const getValue = (): Float32Array => {
    if (type === 'fft') {
      analyser.getFloatFrequencyData(buffer);
    } else {
      analyser.getFloatTimeDomainData(buffer);
    }

    return buffer;
  };

  const dispose = () => {
    analyser.disconnect();
  };

  return {
    ...extractAudioNode(analyser),

    // TODO properties
    fftSize: setter(() => analyser.fftSize, (value) => analyser.fftSize = value),
    frequencyBinCount: analyser.frequencyBinCount, // this is read only so idc
    maxDecibels: setter(() => analyser.maxDecibels, (value) => analyser.maxDecibels = value),
    minDecibels: setter(() => analyser.minDecibels, (value) => analyser.minDecibels = value),
    smoothingTimeConstant: setter(
      () => analyser.smoothingTimeConstant,
      (value) => analyser.smoothingTimeConstant = value,
    ),
    getByteFrequencyData: analyser.getByteFrequencyData.bind(analyser),
    // until here

    getValue,
    dispose,
  };
};
