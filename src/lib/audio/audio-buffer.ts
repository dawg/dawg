import { range } from '@/lib/std';
import { ContextTime } from '@/lib/audio/types';

export interface ObeoBuffer extends AudioBuffer {
  toArray(): Float32Array[];
  forEach(callback: (sample: number, time: number) => void): void;
  getValueAtTime(time: ContextTime, channel?: number): number;
  /**
   * Returns a new ObeoBuffer which has all of the channels summed to a single channel
   */
  toMono(audioBuffer: ObeoBuffer): ObeoBuffer;
}

// TODO change the file name?
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
    const channels = toMono(obeoBuffer).toArray();
    channels[0].forEach((sample, index) => {
      cb(sample, index / buffer.sampleRate);
    });
  };

  const toMono = (toConvert: ObeoBuffer): ObeoBuffer => {
    const context = new OfflineAudioContext(1, 1, toConvert.sampleRate);
    const audioBuffer = context.createBuffer(1, toConvert.length, toConvert.sampleRate);
    // sum all the channels into a single channel
    const bufferArray = audioBuffer.getChannelData(0);
    toConvert.toArray().forEach((channel) => {
      channel.forEach((value, index) => {
        bufferArray[index] += value;
      });
    });

    return createAudioBuffer(audioBuffer);
  };

  // TODO is this what we want?? To use Object.assign ??
  const obeoBuffer: ObeoBuffer = Object.assign(buffer, { toArray, getValueAtTime, forEach, toMono });
  return obeoBuffer;
};
