import { createVolume } from '@/lib/audio/volume';
import { expect } from '@/lib/testing';
import { createGain } from '@/lib/audio/gain';
import { passAudio } from '@/lib/audio/test-utils';
import { runOffline } from '@/lib/audio/offline';
import { createSignal } from '@/lib/audio/signal';

describe('ObeoVolume', () => {

  context('Volume', () => {

    it('handles input and output connections', () => {
      const vol = createVolume();
      vol.connect(createGain());
      createGain().connect(vol);
      createGain().connect(vol.volume);
      vol.dispose();
    });

    it('can be constructed with an options object', () => {
      const vol = createVolume({
        volume: 2,
      });
      expect(vol.volume.value).to.be.closeTo(2, 0.1);
      vol.dispose();
    });

    it('can be constructed with an options object and muted', () => {
      const vol = createVolume({
        muted: true,
      });
      expect(vol.muted.value).to.equal(true);
      vol.dispose();
    });

    it('unmuting returns to previous volume', () => {
      const vol = createVolume({ volume: -10 });
      vol.muted.value = true;
      expect(vol.muted.value).to.equal(true);
      expect(vol.volume.value).to.equal(-Infinity);
      vol.muted.value = false;
      // returns the volume to what it was
      expect(vol.volume.value).to.be.closeTo(-10, 0.1);
      vol.dispose();
    });

    it('passes the incoming signal through', () => {
      return passAudio((input) => {
        const vol = createVolume();
        vol.toDestination();
        input.connect(vol);
      });
    });

    it('can lower the volume', () => {
      return runOffline(() => {
        const vol = createVolume({ volume: -10 });
        vol.toDestination();
        createSignal({ value: 1 }).connect(vol);
      }).then((buffer) => {
        expect(buffer.value()).to.be.closeTo(0.315, 0.01);
      });
    });

    it('can mute the volume', () => {
      return runOffline(() => {
        const vol = createVolume({ volume: 0 });
        vol.toDestination();
        createSignal({ value: 1 }).connect(vol);
        vol.muted.value = true;
      }).then((buffer) => {
        expect(buffer.isSilent()).to.equal(true);
      });
    });

    it('muted when volume is set to -Infinity', () => {
      return runOffline(() => {
        const vol = createVolume({ volume: -Infinity });
        vol.toDestination();
        createSignal({ value: 1 }).connect(vol);
        expect(vol.muted.value).to.equal(true);
      }).then((buffer) => {
        expect(buffer.isSilent()).to.equal(true);
      });
    });

    it('setting the volume unmutes it and reports itself as unmuted', () => {
      const vol = createVolume({ volume: 0 });
      vol.toDestination();
      vol.muted.value = true;
      expect(vol.muted.value).to.equal(true);
      vol.volume.value = 0;
      expect(vol.muted.value).is.equal(false);
      vol.dispose();
    });

    it('multiple calls to mute still return the vol to the original', () => {
      const vol = createVolume({ volume: -20 });
      vol.muted.value = true;
      vol.muted.value = true;
      expect(vol.muted.value).to.equal(true);
      expect(vol.volume.value).to.equal(-Infinity);
      vol.muted.value = false;
      vol.muted.value = false;
      expect(vol.volume.value).to.be.closeTo(-20, 0.5);
      vol.dispose();
    });
  });
});
