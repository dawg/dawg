import { Seconds } from '@/lib/audio/types';
import { enhanceBaseContext, ObeoContext } from '@/lib/audio/context';
import { getContext, setContext } from '@/lib/audio/global';
import { createAudioBuffer, ObeoBuffer } from '@/lib/audio/audio-buffer';

export const createOfflineContext = (options: OfflineAudioContextOptions) => {
  const offline = enhanceBaseContext(new OfflineAudioContext(options));
  let currentTime: Seconds = 0;

  const renderClock = async (asynchronous: boolean) => {
    let index = 0;
    while (offline.length - currentTime >= 0) {

      // invoke all the callbacks on that time
      // TODO
      // this.emit('tick');

      // increment the clock in block-sized chunks
      currentTime += 128;

      // yield once a second of audio
      index++;

      const yieldEvery = Math.floor(offline.sampleRate / 128);
      if (asynchronous && index % yieldEvery === 0) {
        await new Promise((done) => setTimeout(done, 1));
      }
    }
  };

  const render = async (asynchronous = true) => {
    // await offline.workletsAreReady();
    await renderClock(asynchronous);
    return await offline.startRendering();
  };

  return Object.assign(offline, { render });
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
  callback: (context: ObeoContext) => void | Promise<void>,
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
  return createAudioBuffer(buffer);
};
