import { ContextTime, Seconds } from '@/lib/audio/types';
import { createVolume, ObeoVolumeOptions } from '@/lib/audio/volume';
import { createBufferSource } from '@/lib/audio/buffer-source';
import { ObeoScheduledSourceStopper } from '@/lib/audio/scheduled-source-node';
import { mimicAudioNode, ObeoNode } from '@/lib/audio/node';

export type ObeoPlayerOptions = ObeoVolumeOptions;

export interface ObeoPlayerInstance {
  start: (context: ObeoPlayerStartContext) => { stop: (when?: ContextTime) => void };
}

export interface ObeoPlayerStartContext {
  time?: Seconds;
  offset?: Seconds;
  duration?: Seconds;
  onended?: () => void;
}

export interface ObeoPlayer extends ObeoNode<GainNode, undefined> {
  start: (context?: ObeoPlayerStartContext) => ObeoScheduledSourceStopper;
}

export const createPlayer = (
  buffer: AudioBuffer | null,
  options?: Partial<ObeoPlayerOptions>,
): ObeoPlayer => {
  const volume = createVolume(options);

  const start = (opts: ObeoPlayerStartContext = {}) => {
    const { offset, duration, time } = opts;
    const source = createBufferSource(buffer, opts);
    source.connect(volume);
    return source.start(time, offset, duration);
  };

  return {
    ...mimicAudioNode(undefined, volume.output),
    start,
  };
};
