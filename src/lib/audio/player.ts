import { ContextTime, Seconds } from '@/lib/audio/types';
import { context } from '@/lib/audio/online';
import { createVolume } from '@/lib/audio/volume';
import { createBufferSource } from '@/lib/audio/buffer-source';

export interface PlayerOptions {
  volume: number;
  mute: boolean;
}

export interface PreviewOptions {
  onEnded: () => void;
}

// TODO are options even used? ie. are they every given?
export const createPlayer = (buffer: AudioBuffer, options?: Partial<PlayerOptions>) => {
  const volume = createVolume();
  // TODO we are not wrapping .value
  volume.volume.value = options?.volume ?? 0;
  volume.mute(options?.mute ?? false);


  const create = (opts?: Partial<PreviewOptions>) => {
    const source = createBufferSource(buffer, opts);
    source.connect(volume);
    return source;
 };

  const preview = (opts?: Partial<PreviewOptions>) => {
    const source = create(opts);
    source.start(context.now(), 0);
    return source;
  };

  const createInstance = () => {
    return {
      start: (o: { startTime: Seconds, offset: Seconds, duration: Seconds }) => {
        const { offset, duration, startTime } = o;
        const source = create();

        source.start(startTime, offset, duration);
        return {
          stop: (seconds: ContextTime) => {
            try {
              source.stop(seconds);
            } catch (e) {
              // already stopped
            }
          },
        };
      },
    };
  };


  return Object.assign({ createInstance, preview }, volume);
};
