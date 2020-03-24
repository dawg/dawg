import { createStereoPanner } from '@/lib/audio/stereo-panner';
import { expect } from '@/lib/testing';
import { runOffline } from '@/lib/audio/offline';
import { createSignal } from '@/lib/audio/signal';

describe('ObeoStereoPanner', () => {
  context('Panning', () => {
    it('can be constructed with an options object', () => {
      const panner = createStereoPanner({
        value: 0.5,
      });
      expect(panner.pan.value).to.be.closeTo(0.5, 0.001);
      panner.dispose();
    });

    it('pans hard left when the pan is set to -1', () => {
      return runOffline(() => {
        const panner = createStereoPanner({ value: -1 });
        panner.toDestination();
        createSignal({ value: 1 }).connect(panner);
      }, { duration: 0.1, channels: 2 }).then((buffer) => {
        const l = buffer.toArray()[0];
        const r = buffer.toArray()[1];
        expect(l[0]).to.be.closeTo(1, 0.01);
        expect(r[0]).to.be.closeTo(0, 0.01);
      });
    });

    it('pans hard right when the pan is set to 1', () => {
      return runOffline(() => {
        const panner = createStereoPanner({ value: 1 });
        panner.toDestination();
        createSignal({ value: 1 }).connect(panner);
      }, { duration: 0.1, channels: 2 }).then((buffer) => {
        const l = buffer.toArray()[0];
        const r = buffer.toArray()[1];
        expect(l[0]).to.be.closeTo(0, 0.01);
        expect(r[0]).to.be.closeTo(1, 0.01);
      });
    });

    it('mixes the signal in equal power when panned center', () => {
      return runOffline(() => {
        const panner = createStereoPanner({ value: 0 });
        panner.toDestination();
        createSignal({ value: 1 }).connect(panner);
      }, { duration: 0.1, channels: 2 }).then((buffer) => {
        const l = buffer.toArray()[0];
        const r = buffer.toArray()[1];
        expect(l[0]).to.be.closeTo(0.707, 0.01);
        expect(r[0]).to.be.closeTo(0.707, 0.01);
      });
    });

    it('can chain two panners when channelCount is 2', () => {
      return runOffline(() => {
        const panner1 = createStereoPanner({
          channelCount: 2,
        });
        panner1.toDestination();
        const panner0 = createStereoPanner({ value: -1 });
        panner0.connect(panner1);
        createSignal({ value: 1 }).connect(panner0);
      }, { duration: 0.1, channels: 2 }).then((buffer) => {
        const l = buffer.toArray()[0];
        const r = buffer.toArray()[1];
        expect(l[0]).to.be.closeTo(1, 0.01);
        expect(r[0]).to.be.closeTo(0, 0.01);
      });
    });
  });
});
