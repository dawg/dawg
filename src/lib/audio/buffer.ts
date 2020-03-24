import { range } from '@/lib/std';
import { ContextTime } from '@/lib/audio/types';

export interface ObeoBuffer {
  readonly duration: number;
  readonly length: number;
  readonly numberOfChannels: number;
  readonly sampleRate: number;
  getChannelData(channel: number): Float32Array;
  toArray(): Float32Array[];
  forEachBetween(
    callback: (sample: number, time: number) => void,
    startTime?: number,
    endTime?: number,
  ): void;
  forEach(callback: (sample: number, time: number) => void): void;
  getValueAtTime(time: ContextTime, channel?: number): number;
  /**
   * The value (only if it is consistent throughout the entire buffer).
   * Throws an error if there are multiple values found.
   */
  value(): number;
  /**
   * Returns a new ObeoBuffer which has all of the channels summed to a single channel
   */
  toMono(): ObeoBuffer;
  /**
   * Test if the buffer has no audio data. if it is at or near 0 the entire buffer.
   */
  isSilent(threshold?: number): boolean;
  /**
   * return the time in seconds of the first time
   * the AudioBuffer rose above the silence threshold
   */
  getTimeOfFirstSound(threshold?: number): number;
  /**
   * Return the last time a sample rose above the threshold
   * @param threshold
   */
  getTimeOfLastSound(threshold?: number): number;
}

export const createAudioBuffer = (buffer: AudioBuffer): ObeoBuffer => {
  const getIndex = (time: ContextTime) => {
    return Math.ceil(time * buffer.sampleRate);
  };

  const toArray = () => {
    return range(buffer.numberOfChannels).map((i) => {
      return buffer.getChannelData(i);
    });
  };

  const getValueAtTime = (time: ContextTime, channel: number = 0) => {
    const i = getIndex(time);
    return buffer.getChannelData(channel)[i];
  };

  const forEach: ObeoBuffer['forEach'] = (cb) => {
    const channels = toMono().toArray();
    channels[0].forEach((sample, index) => {
      cb(sample, index / buffer.sampleRate);
    });
  };

  const toMono = (): ObeoBuffer => {
    const context = new OfflineAudioContext(1, 1, obeoBuffer.sampleRate);
    const audioBuffer = context.createBuffer(1, obeoBuffer.length, obeoBuffer.sampleRate);
    // sum all the channels into a single channel
    const bufferArray = audioBuffer.getChannelData(0);
    obeoBuffer.toArray().forEach((channel) => {
      channel.forEach((sample, index) => {
        bufferArray[index] += sample;
      });
    });

    return createAudioBuffer(audioBuffer);
  };

  /**
   * The maximum sample value across all the channels
   */
  const max = (): number => {
    let result = -Infinity;
    toArray().forEach((channel) => {
      result = Math.max(result, ...Array.from(channel));
    });
    return result;
  };

  /**
   * The minimum sample value across all the channels
   */
  const min = (): number => {
    let result = Infinity;
    toArray().forEach((channel) => {
      result = Math.min(result, ...Array.from(channel));
    });
    return result;
  };

  /**
   * The value (only if it is consistent throughout the entire buffer).
   * Throws an error if there are multiple values found.
   */
  const value = (): number => {
    const maxValue = max();
    const minValue = min();
    if (maxValue - minValue > 1e-6) {
      throw new Error('multiple values found in this buffer');
    }

    return maxValue;
  };


  const isSilent = (threshold = 1e-6): boolean => {
    try {
      return Math.abs(value()) < threshold;
    } catch (e) {
      return false;
    }
  };

  const getTimeOfFirstSound = (threshold = 1e-6): number => {
    const firstSampleTimes = toArray().map((channel) => {
      for (let i = 0; i < channel.length; i++) {
        const sample = channel[i];
        if (sample > threshold) {
          return i / buffer.sampleRate;
        }
      }
      return -1;
    });

    return Math.min(...firstSampleTimes);
  };

  const getTimeOfLastSound = (threshold = 1e-6): number => {
    const lastSampleTimes = toArray().map((channel) => {
      for (let i = channel.length - 1; i >= 0; i--) {
        const sample = channel[i];
        if (sample > threshold) {
          return i / buffer.sampleRate;
        }
      }
      return -1;
    });

    return Math.max(...lastSampleTimes);
  };

  const forEachBetween = (
    callback: (sample: number, time: number) => void,
    startTime = 0,
    endTime: number = buffer.duration,
  ): void => {
    const channels = toMono().toArray();
    const startSamples = Math.floor(startTime * buffer.sampleRate);
    const endSamples = Math.floor(Math.min(endTime * buffer.sampleRate, buffer.length));
    for (let s = startSamples; s < endSamples; s++) {
      const sample = channels[0][s];
      callback(sample, s / buffer.sampleRate);
    }
  };

  const obeoBuffer: ObeoBuffer = Object.assign(buffer, {
    toArray,
    getValueAtTime,
    forEach,
    toMono,
    isSilent,
    getTimeOfFirstSound,
    getTimeOfLastSound,
    forEachBetween,
    value,
  });

  return obeoBuffer;
};
