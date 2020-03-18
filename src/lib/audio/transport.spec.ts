import { runOffline } from '@/lib/audio/offline';
import { expect } from '@/lib/testing';
import { createTransport } from '@/lib/audio/transport';

describe.only('ObeoTransport', () => {
  it('can get and set bpm', () => {
    return runOffline(() => {
      const transport = createTransport();
      transport.bpm.value = 125;
      expect(transport.bpm.value).to.be.closeTo(125, 0.001);
      transport.bpm.value = 120;
      expect(transport.bpm.value).to.equal(120);
    });
  });
});
