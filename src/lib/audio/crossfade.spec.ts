import { createCrossfade } from '@/lib/audio/crossfade';
import { createGain } from '@/lib/audio/gain';
import { testConstantOutput } from '@/lib/audio/test-utils';
import { createSignal } from '@/lib/audio/signal';

describe('ObeoCrossFade', () => {

  context('fading', () => {
    it('handles input and output connections', () => {
      const comp = createCrossfade();
      createGain().connect(comp.a);
      createGain().connect(comp.b);
      comp.connect(createGain());
      comp.dispose();
    });

    it('pass 100% of input 0', () => {
      return testConstantOutput(() => {
        const crossFade = createCrossfade();
        const drySignal = createSignal({ value: 10 });
        const wetSignal = createSignal({ value: 20 });
        drySignal.connect(crossFade.a);
        wetSignal.connect(crossFade.b);
        crossFade.fade.offset.value = 0;
        crossFade.toDestination();
      }, 10, 0.05);
    });

    it('pass 100% of input 1', () => {
      return testConstantOutput(() => {
        const crossFade = createCrossfade();
        const drySignal = createSignal({ value: 10 });
        const wetSignal = createSignal({ value: 20 });
        drySignal.connect(crossFade.a);
        wetSignal.connect(crossFade.b);
        crossFade.fade.offset.value = 1;
        crossFade.toDestination();
      }, 20, 0.01);
    });

    it('can mix two signals', () => {
      return testConstantOutput(() => {
        const crossFade = createCrossfade();
        const drySignal = createSignal({ value: 2 });
        const wetSignal = createSignal({ value: 1 });
        drySignal.connect(crossFade.a);
        wetSignal.connect(crossFade.b);
        crossFade.fade.offset.value = 0.5;
        crossFade.toDestination();
      }, 2.12, 0.01);
    });
  });

});
