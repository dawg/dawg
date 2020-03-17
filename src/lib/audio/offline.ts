import { Seconds } from '@/lib/audio/types';
import { enhanceBaseContext, ObeoBaseContext } from '@/lib/audio/context';
import { getContext, setContext } from '@/lib/audio/global';
import { createAudioBuffer, ObeoBuffer } from '@/lib/audio/audio-buffer';
import { emitter } from '@/lib/events';
import { Disposer } from '@/lib/std';
import { getter } from '@/lib/reactor';

export interface ObeoOfflineContext extends ObeoBaseContext {
  readonly length: number;
  onDidTick(cb: () => void): Disposer;
  render(asynchronous?: boolean): Promise<AudioBuffer>;
  resume(): Promise<void>;
  dispose(): void;
}

export const createOfflineContext = (options: OfflineAudioContextOptions): ObeoOfflineContext => {
  const events = emitter<{ tick: [] }>();

  const offlineContext = new OfflineAudioContext(options);
  const offline = enhanceBaseContext(offlineContext);

  let currentTime: Seconds = 0;

  const renderClock = async (asynchronous: boolean) => {
    let index = 0;
    let samples = 0;
    const yieldEvery = Math.floor(offline.sampleRate / 128);
    while (samples <= offlineContext.length) {

      // invoke all the callbacks on that time
      events.emit('tick');

      // increment the clock in block-sized chunks
      currentTime += 128 / offline.sampleRate;
      samples += 128;

      // yield once a second of audio
      index++;

      if (asynchronous && index % yieldEvery === 0) {
        await new Promise((done) => setTimeout(done, 1));
      }
    }
  };

  const onDidTick: ObeoOfflineContext['onDidTick'] = (cb) => {
    return events.on('tick', cb);
  };

  const render: ObeoOfflineContext['render'] = async (asynchronous = true) => {
    // await offline.workletsAreReady();
    await renderClock(asynchronous);
    return await offlineContext.startRendering();
  };

  const dispose = () => {
    events.removeAllListeners();
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
    onDidTick,
    dispose,
    render,
  };
};

interface RunOfflineOptions {
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

export const runOffline = async (
  callback: (context: ObeoOfflineContext) => void | Promise<void>,
  { duration = 0.1, channels = 1, sampleRate = 44100 }: RunOfflineOptions = {},
): Promise<ObeoBuffer> => {
  const originalContext = getContext();
  const offline = createOfflineContext({
    numberOfChannels: channels,
    length: duration * sampleRate + 1,
    sampleRate,
  });

  setContext(offline);
  await callback(offline);
  setContext(originalContext);

  const buffer = await offline.render();
  offline.dispose();

  return createAudioBuffer(buffer);
};
