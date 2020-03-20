import { ContextTime, Seconds } from '@/lib/audio/types';
import { createVolume, ObeoVolumeNode } from '@/lib/audio/volume';
import { createBufferSource, ObeoBufferSource } from '@/lib/audio/buffer-source';
import { getContext } from '@/lib/audio/global';

export interface PlayerOptions {
  volume: number;
  mute: boolean;
}

export interface PreviewOptions {
  onended: () => void;
}

export interface ObeoPlayerInstance {
  start: (context: ObeoPlayerStartContext) => { stop: (when?: ContextTime) => void };
}

export interface ObeoPlayerStartContext {
  startTime: Seconds;
  offset: Seconds;
  duration: Seconds;
}

export interface ObeoPlayer extends ObeoVolumeNode {
  preview: (opts?: Partial<PreviewOptions>) => { stop: (when?: ContextTime) => void };
  createInstance(): ObeoPlayerInstance;
}

// TODO are options even used? ie. are they every given?
export const createPlayer = (buffer: AudioBuffer, options?: Partial<PlayerOptions>): ObeoPlayer => {
  const context = getContext();

  const volume = createVolume();
  volume.volume.value = options?.volume ?? 0;
  volume.muted.value = options?.mute ?? false;


  const create = (opts?: Partial<PreviewOptions>) => {
    const source = createBufferSource(buffer, opts);
    source.connect(volume);
    return source;
  };

  const createStop = (source: ObeoBufferSource) => (when?: ContextTime) => {
    try {
      source.stop(when);
    } catch (e) {
      // already stopped
    }
  };

  const preview = (opts?: Partial<PreviewOptions>) => {
    const source = create(opts);
    source.start(context.now(), 0);
    return {
      stop: createStop(source),
    };
  };

  const createInstance = () => {
    return {
      start: (o: ObeoPlayerStartContext) => {
        const { offset, duration, startTime } = o;
        const source = create();

        source.start(startTime, offset, duration);
        return {
          stop: createStop(source),
        };
      },
    };
  };

  return {
    ...volume,
    createInstance,
    preview,
  };
};
