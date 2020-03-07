import { Seconds } from '@/lib/audio/types';

export const createOfflineContext = (options: OfflineAudioContextOptions) => {
  const offline = new OfflineAudioContext(options);
  let currentTime: Seconds = 0;

  const renderClock = async (asynchronous: boolean) => {
    let index = 0;
    while (offline.length - currentTime >= 0) {

      // invoke all the callbacks on that time
      // TODO
      // this.emit('tick');

      // increment the clock in block-sized chunks
      currentTime += 128 / offline.sampleRate;

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

  return Object.assign({ render }, offline);
};
