import { context } from '@/lib/audio/context';
import { PowerOfTwo, NormalRange } from '@/lib/audio/types';

export type AnalyserType = 'fft' | 'waveform';

export interface AnalyserOptions {
  size: PowerOfTwo;
  type: AnalyserType;
  smoothing: NormalRange;
}

export const createAnalyser = (opts?: Partial<AnalyserOptions>) => {
  const analyser = context.createAnalyser();
  const size = opts?.size ?? 1024;
  const smoothing = opts?.smoothing ?? 0.8;
  const type: AnalyserType = opts?.type ?? 'fft';
  const buffer = new Float32Array(size);

  analyser.smoothingTimeConstant = smoothing;

  const getValue = (): Float32Array => {
    if (type === 'fft') {
      analyser.getFloatFrequencyData(buffer);
    } else {
      analyser.getFloatTimeDomainData(buffer);
    }

    return buffer;
  };

  return Object.assign({ getValue }, analyser);
};
