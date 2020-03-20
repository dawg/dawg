import { range } from '@/lib/std';
import { analyse, createTestAudioBuffer } from '@/lib/audio/test-utils';
import { expect } from '@/lib/testing';

describe('test-utils', () => {
  describe('analyse', () => {
    it('performs a sanity check', () => {
      const buffer = createTestAudioBuffer(range(256 + 1));
      const spectrogram = analyse(buffer);

      expect(Array.from(buffer.toArray()[0]).slice(0, 10)).to.deep.eq(range(10));
      expect(spectrogram.length).to.eq(1);
      expect(Array.from(spectrogram[0]).slice(0, 10)).to.deep.eq([
        91.1239610161989,
        64.08810794364311,
        20.80352811908414,
        2.290289601187109,
        0.010587249383654292,
        0.0010443372279769012,
        0.001622689328468812,
        0.002113392217216705,
        0.001876881919682347,
        0.0015062583589091126,
      ]);
    });
  });
});
