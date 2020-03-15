import { context } from '@/lib/audio/online';
import { PowerOfTwo, NormalRange } from '@/lib/audio/types';
import { ObeoNode, extractAudioNode } from '@/lib/audio/node';

export interface ObeoAnalyser extends ObeoNode<AnalyserNode> {
  fftSize: number;
  readonly frequencyBinCount: number;
  maxDecibels: number;
  minDecibels: number;
  smoothingTimeConstant: number;
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
    fftSize: analyser.fftSize,
    frequencyBinCount: analyser.frequencyBinCount, // this is read only so idc
    maxDecibels: analyser.maxDecibels,
    minDecibels: analyser.minDecibels,
    smoothingTimeConstant: analyser.smoothingTimeConstant,
    // until here

    getValue,
    dispose,
  };
};
