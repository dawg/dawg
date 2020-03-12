import { range } from '@/lib/std';
import { ContextTime } from '@/lib/audio/types';

export interface ObeoBuffer extends AudioBuffer {
  toArray(): Float32Array[];
  getValueAtTime(time: ContextTime, channel?: number): number;
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

  return Object.assign(buffer, { toArray, getValueAtTime });
};
