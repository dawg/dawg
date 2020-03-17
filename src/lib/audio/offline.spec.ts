import { createOfflineContext } from '@/lib/audio/offline';
import { expect } from '@/lib/testing';

describe('offline', () => {
  it('can access basics', () => {
    const offline = createOfflineContext({
      length: 1000,
      sampleRate: 3000,
      numberOfChannels: 1,
    });

    // Ensuring these are not NaNs and no errors occur
    // This was previously an issue when using properties
    expect(offline.BPM.value).to.eq(120);
    expect(offline.length).to.eq(1000);
    expect(offline.sampleRate).to.eq(3000);
    expect(offline.sampleTime).to.be.closeTo(1 / 3000, 0.001);
  });

  it.only('renders correctly', async () => {
    const offline = createOfflineContext({
      length: 4500,
      sampleRate: 3000,
      numberOfChannels: 1,
    });

    let time = 0;
    let ran = false;
    let count = 0;
    const disposer = offline.onDidTick(() => {
      ran = true;
      count += 1;

      // 128 is how many samples we are incrementing by
      // See the offline.ts file for more info
      expect(offline.currentTime.value).to.eq(time);
      expect(offline.now()).to.eq(time);
      time += 128 / offline.sampleRate;
    });

    await offline.render();

    expect(ran).to.eq(true);
    expect(count).to.eq(Math.ceil(offline.length / 128));
    disposer.dispose();
  });
});
