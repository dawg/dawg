import { compareToFile } from '@/lib/audio/test-utils';
import { createAmplitudeEnvelope } from '@/lib/audio/amplitude-envelope';
import { createOscillator } from '@/lib/audio/oscillator';
import { expect } from '@/lib/testing';
import { runOffline } from '@/lib/audio/offline';
import { createSignal } from '@/lib/audio/signal';

describe('AmplitudeEnvelope', () => {

  context('Comparisons', () => {
    // TODO come back to these later
    it.skip('matches a file', () => {
      return compareToFile(async () => {
        const ampEnv = createAmplitudeEnvelope({
          attack: 0.1,
          decay: 0.2,
          release: 0.2,
          sustain: 0.1,
        });

        ampEnv.toDestination();
        const osc = createOscillator();
        osc.start(0);
        osc.connect(ampEnv);
        ampEnv.triggerAttack(0);
        ampEnv.triggerRelease(0.3);
      }, 'ampEnvelope.wav');
    });

    it.skip('matches a file with multiple retriggers', () => {
      return compareToFile(() => {
        const ampEnv = createAmplitudeEnvelope({
          attack: 0.1,
          decay: 0.2,
          release: 0.2,
          sustain: 0.1,
        });
        ampEnv.toDestination();
        const osc = createOscillator();
        osc.start(0);
        osc.connect(ampEnv);
        ampEnv.triggerAttack(0);
        ampEnv.triggerAttack(0.3);
      }, 'ampEnvelope2.wav', { threshold: 0.004 });
    });
  });

  context('Envelope', () => {
    it('passes no signal before being triggered', () => {
      return runOffline(() => {
        const ampEnv = createAmplitudeEnvelope();
        ampEnv.toDestination();
        createSignal({ value: 1 }).connect(ampEnv);
      }).then((buffer) => {
        expect(buffer.isSilent()).to.eq(true);
      });
    });

    it('passes signal once triggered', () => {
      return runOffline(() => {
        const ampEnv = createAmplitudeEnvelope();
        ampEnv.toDestination();
        createSignal({ value: 1 }).connect(ampEnv);
        ampEnv.triggerAttack(0.1);
      }, 0.2).then((buffer) => {
        expect(buffer.getTimeOfFirstSound()).to.be.closeTo(0.1, 0.001);
      });
    });
  });
});
