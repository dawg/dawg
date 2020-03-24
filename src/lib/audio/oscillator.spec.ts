import { createOscillator } from '@/lib/audio/oscillator';
import { compareToFile } from '@/lib/audio/test-utils';
import { runOffline } from '@/lib/audio/offline';
import { expect } from '@/lib/testing';

describe('ObeoOscillator', () => {

  // run the common tests
  // BasicTests(Oscillator);
  // SourceTests(Oscillator);
  // OscillatorTests(Oscillator);

  it.skip('matches a file', () => {
    return compareToFile(() => {
      const osc = createOscillator();
      osc.toDestination();
      osc.type = 'square';
      osc.start(0).stop(0.2);
    }, 'oscillator.wav', 0.1);
  });

  context.skip('Phase Rotation', () => {
    it('can change the phase to 90', () => {
      return runOffline(() => {
        const instance = createOscillator({
          frequency: 1,
          // phase: 90,
        });
        instance.toDestination();
        instance.start(0);
      }, 1).then((buffer) => {
        buffer.forEach((sample, time) => {
          if (time < 0.25) {
            expect(sample).to.be.within(-1, 0);
          } else if (time > 0.25 && time < 0.5) {
            expect(sample).to.be.within(0, 1);
          }
        });
      });
    });

    it.skip('can change the phase to -90', () => {
      return runOffline(() => {
        const instance = createOscillator({
          frequency: 1,
          // phase: 270,
        });
        instance.toDestination();
        instance.start(0);
      }, 1).then((buffer) => {
        buffer.forEach((sample, time) => {
          if (time < 0.25) {
            expect(sample).to.be.within(0, 1);
          } else if (time > 0.25 && time < 0.5) {
            expect(sample).to.be.within(-1, 0);
          }
        });
      });
    });

    it.skip('can go past the cache max size of 100', () => {
      const osc = createOscillator();
      for (let i = 0; i < 110; i++) {
        // osc.phase = i;
      }
      osc.dispose();
    });

  });

  context('Type', () => {

    it('can get and set the type', () => {
      const osc = createOscillator({
        type: 'sawtooth',
      });
      expect(osc.type).to.equal('sawtooth');
      osc.dispose();
    });

    it('can set the type after starting', () => {
      const osc = createOscillator({ frequency: 110, type: 'sine' });
      osc.start();
      expect(osc.type).to.equal('sine');
      osc.type = 'triangle';
      expect(osc.type).to.equal('triangle');
      osc.dispose();
    });

    it('handles 4 basic types', () => {
      const osc = createOscillator();
      const types = ['triangle', 'sawtooth', 'sine', 'square'] as const;
      for (const type of types) {
        osc.type = type;
        expect(osc.type).to.equal(type);
      }
      osc.dispose();
    });
  });
});
