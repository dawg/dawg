import { Seconds, ContextTime } from '@/lib/audio/types';
import { enhanceBaseContext, ObeoBaseContext } from '@/lib/audio/context';
import { getContext, setContext } from '@/lib/audio/global';
import { createAudioBuffer, ObeoBuffer } from '@/lib/audio/audio-buffer';
import { emitter } from '@/lib/events';
import { Disposer } from '@/lib/std';
import { getter } from '@/lib/reactor';

export interface ObeoOfflineContext extends ObeoBaseContext<OfflineAudioContext> {
  readonly length: number;
  render(asynchronous?: boolean): Promise<AudioBuffer>;
  resume(): Promise<void>;
  dispose(): void;
  /**
   * Use this to have complete control over the clock :) It will advance the clock by the given
   * amount and then emit a tick event.
   * @param seconds The amount to advance!
   */
  advance(seconds: Seconds): void;
}

export const createOfflineContext = (options: Partial<OfflineAudioContextOptions> = {}): ObeoOfflineContext => {
  const events = emitter<{ tick: [] }>();

  const sampleRate = options.sampleRate ?? 44100;
  const offlineContext = new OfflineAudioContext({
    length: options.length ?? 0.1 * sampleRate,
    sampleRate,
    numberOfChannels: options.numberOfChannels ?? 1,
  });

  const offline = enhanceBaseContext(offlineContext, (cb) => {
    return events.on('tick', cb);
  });

  let currentTime: Seconds = 0;

  const renderClock = async (asynchronous: boolean) => {
    let index = 0;
    let samples = 0;
    const yieldEvery = Math.floor(offline.sampleRate / 128);
    while (samples <= offlineContext.length) {
      // invoke all the callbacks on that time
      events.emit('tick');

      // increment the clock in block-sized chunks
      // TODO use PPQ ??
      currentTime += 128 / offline.sampleRate;
      samples += 128;

      // yield once a second of audio
      index++;

      if (asynchronous && index % yieldEvery === 0) {
        await new Promise((done) => setTimeout(done, 1));
      }
    }
  };

  const render: ObeoOfflineContext['render'] = async (asynchronous = true) => {
    // await offline.workletsAreReady();
    await renderClock(asynchronous);
    return await offlineContext.startRendering();
  };

  const dispose = () => {
    events.removeAllListeners();
  };

  const advance = (seconds: Seconds) => {
    currentTime += seconds;
    events.emit('tick');
  };

  return {
    ...offline,
    resume: offlineContext.resume.bind(offlineContext),
    length: offlineContext.length,


    // Override
    currentTime: getter(() => {
      return currentTime;
    }),
    now: () => {
      return currentTime;
    },

    // Extra functionality
    advance,
    dispose,
    render,
  };
};

export interface RunOfflineOptions {
  /**
   * Duration in seconds.
   */
  duration?: number;
  /**
   * The # of channels to render.
   */
  channels?: number;
  /**
   * The sample rate to render at.
   */
  sampleRate?: number;
}

type Nothing = void | Promise<void>;
type OnTick = ((time: ContextTime) => void) | Promise<(time: ContextTime) => void>;

export const runOffline = async (
  callback: (context: ObeoOfflineContext) => Nothing | OnTick,
  options: RunOfflineOptions | number = {},
): Promise<ObeoBuffer> => {
  if (typeof options === 'number') {
    options = { duration: options };
  }

  const { duration = 0.1, channels = 1, sampleRate = 44100 } = options;
  const originalContext = getContext();
  const offline = createOfflineContext({
    numberOfChannels: channels,
    length: duration * sampleRate + 1,
    sampleRate,
  });

  setContext(offline);
  const onTick = await callback(offline);
  if (onTick) {
    offline.onDidTick(() => {
      onTick(offline.now());
    });
  }

  const buffer = await offline.render();

  setContext(originalContext);
  offline.dispose();

  return createAudioBuffer(buffer);
};

