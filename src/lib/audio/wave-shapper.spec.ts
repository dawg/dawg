import { createWaveShaper } from '@/lib/audio/wave-shaper';
import { runOffline } from '@/lib/audio/offline';
import { expect } from '@/lib/testing';

describe('ObeoWaveShaper', () => {
  it('can run waveform analysis', async () => {
    const buffer = await runOffline((offline) => {
      const shaper = createWaveShaper({
        mapping: (x) => Math.abs(x) * 2,
        length: 10,
      });

      const source = offline.createConstantSource();
      source.connect(shaper.input);
      shaper.toDestination();

      source.start(0);
    }, { duration: 0.1  });

    const result = buffer.toArray().slice(0, 10);
    expect(result[0].length).to.eq(4411);
    expect(Array.from(result[0]).slice(0, 10)).to.deep.eq(Array(10).fill(2));
  });
});
