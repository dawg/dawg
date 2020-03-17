import { NormalRange } from '@/lib/audio/types';
import { createAnalyser } from '@/lib/audio/analyser';
import { gainToDb } from '@/lib/audio/conversions';
import { ObeoNode } from '@/lib/audio/node';

// TODO check all names conform to format

export interface ObeoMeter extends ObeoNode<AnalyserNode> {
  /**
   * See [[ObeoMeterOptions]].
   */
  readonly smoothing: number;
  /**
   * Get the current value of the incoming signal.
   * Output is in decibels when [[normalRange]] is `false`.
   * If [[channels]] = 1, then the output is a single number
   * representing the value of the input signal. When [[channels]] > 1,
   * then each channel is returned as a value in a number array.
   */
  getValue(): number;
}

export interface ObeoMeterOptions {
  /**
   * A value from between 0 and 1 where 0 represents no time averaging with the last analysis frame.
   */
  smoothing: NormalRange;
  /**
   * If the output should be in decibels or normal range between 0-1. If `normalRange` is false,
   * the output range will be the measured decibel value, otherwise the decibel value will be converted to
   * the range of 0-1
   */
  normalRange: boolean;
}

/**
 * Meter gets the [RMS](https://en.wikipedia.org/wiki/Root_mean_square)
 * of an input signal. It can also get the raw value of the input signal.
 */
export const createMeter = (opts?: Partial<ObeoMeterOptions>): ObeoMeter => {
  const smoothing = opts?.smoothing ?? 0.8;
  const normalRange = opts?.normalRange ?? false;
  /**
   * The previous frame's value
   */
  let rms = 0;
  const analyser = createAnalyser({
    size: 256,
    type: 'waveform',
  });

  const getValue = (): number => {
    const values = analyser.getValue();
    const totalSquared = values.reduce((total, current) => total + current * current, 0);
    const newRms = Math.sqrt(totalSquared / values.length);
    // the rms can only fall at the rate of the smoothing
    // but can jump up instantly
    rms = Math.max(newRms, rms * smoothing);
    return normalRange ? rms : gainToDb(rms);
  };

  return {
    // TODO what if there are properties??
    ...analyser,
    getValue,
    smoothing,
    dispose: () => {
      analyser.dispose();
    },
  };
};


