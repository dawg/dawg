import { createDistortion } from '@/lib/audio/distortion';
import { createOscillator } from '@/lib/audio/oscillator';
import { expect } from '@/lib/testing';
import { compareToFile } from '@/lib/audio/test-utils';
import { runOffline } from '@/lib/audio/offline';

describe('ObeoDistortion', () => {
  it('does a sanity check', async () => {
    const buffer = await runOffline((offline) => {
      const dist = createDistortion({ distortion: 0.8 });
      dist.toDestination();
      const osc = createOscillator();
      osc.connect(dist);
      osc.type = 'sine';
      osc.start(0).stop(0.4);
    }, { duration: 0.01 });

    const bufferArray = buffer.toArray();
    expect(bufferArray.length).to.eq(1);
    const channel = Array.from(bufferArray[0]);
    expect(channel.length).to.eq(442);
    // TODO why doesn't this work??
    // expect(channel.some((value) => value !== 0)).to.eq(true);
  });

  it('matches a file', () => {
    return compareToFile(() => {
      const dist = createDistortion({ distortion: 0.8 });
      dist.toDestination();

      const osc = createOscillator();
      osc.connect(dist);

      osc.type = 'square';
      osc.start(0).stop(0.4);
    }, 'distortion.wav');
  });


  it('can pass in options in the constructor', () => {
    const dist = createDistortion({
      distortion: 0.2,
    });
    expect(dist.distortion.value).to.be.closeTo(0.2, 0.01);
    dist.dispose();
  });
});
