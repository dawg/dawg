import { createPolySynth, ObeoPolySynth } from '@/lib/audio/poly-synth';
import { compareToFile, atTime, warns } from '@/lib/audio/test-utils';
import { createSynth } from '@/lib/audio/synth';
import { runOffline } from '@/lib/audio/offline';
import { EnvelopeOptions } from '@/lib/audio/envelope';
import { expect } from '@/lib/testing';
import { Note, Seconds, ContextTime } from '@/lib/audio/types';

const create = (opts: { onended: () => void }) => {
  return createSynth({ oscillator: { onended: opts.onended, type: 'triangle' } });
};

const triggerAttackRelease = (poly: ObeoPolySynth, notes: Note[], duration: Seconds, time?: ContextTime) => {
  notes.forEach((note) => poly.triggerAttackRelease(note, duration, time));
};

const triggerAttack = (poly: ObeoPolySynth, notes: Note[], duration: Seconds, time?: ContextTime) => {
  return notes.map((note) => poly.triggerAttack(note, duration, time));
};

const createWithOptions = (options: Partial<EnvelopeOptions>) => (opts: { onended: () => void }) => {
  return createSynth({
    oscillator: { onended: opts.onended, type: 'triangle' },
    envelope: options,
  });
};

describe('ObeoPolySynth', () => {
  it('matches a file', () => {
    return compareToFile(() => {
      const synth = createPolySynth(create);
      synth.toDestination();
      synth.triggerAttackRelease('C4', 0.2, 0);
      synth.triggerAttackRelease('C4', 0.1, 0.1);
      synth.triggerAttackRelease('E4', 0.1, 0.2);
      synth.triggerAttackRelease('E4', 0.1, 0.3);
      synth.triggerAttackRelease('G4', 0.1, 0.4);
      synth.triggerAttackRelease('B4', 0.1, 0.4);
      synth.triggerAttackRelease('C4', 0.2, 0.5);
    }, 'polySynth.wav', { threshold: 0.6 });
  });

  it('matches another file', () => {
    return compareToFile(() => {
      const synth = createPolySynth(create);
      synth.toDestination();
      (['C4', 'E4', 'G4', 'B4'] as const).forEach((note) => {
        synth.triggerAttackRelease(note, 0.2, 0);
      });
      (['C4', 'E4', 'G4', 'B4'] as const).forEach((note) => {
        synth.triggerAttackRelease(note, 0.2, 0.3);
      });
    }, 'polySynth2.wav', { threshold: 0.6 });
  });

  it('matches a file and chooses the right voice', () => {
    return compareToFile(() => {
      const synth = createPolySynth(create);
      synth.toDestination();
      triggerAttackRelease(synth, ['C4', 'E4'], 1, 0);
      synth.triggerAttackRelease('G4', 0.1, 0.2);
      synth.triggerAttackRelease('B4', 0.1, 0.4);
      synth.triggerAttackRelease('G4', 0.1, 0.6);
    }, 'polySynth3.wav', { threshold: 0.5 });
  });


  context('Playing Notes', () => {
    it('is silent before being triggered', () => {
      return runOffline(() => {
        const polySynth = createPolySynth(create);
        polySynth.toDestination();
      }).then((buffer) => {
        expect(buffer.isSilent()).to.eq(true);
      });
    });

    it('can be scheduled to start in the future', () => {
      return runOffline(() => {
        const polySynth = createPolySynth(create);
        polySynth.toDestination();
        polySynth.triggerAttack('C4', 0.1);
      }, 0.3).then((buffer) => {
        expect(buffer.getTimeOfFirstSound()).to.be.closeTo(0.1, 0.01);
      });
    });

    it('disposes voices when they are no longer used', () => {
      return runOffline(() => {
        const polySynth = createPolySynth(createWithOptions({ release: 0.1 }));
        polySynth.toDestination();
        triggerAttackRelease(polySynth, ['C4', 'E4', 'G4', 'B4', 'D5'], 0.1, 0);
        return () => [
          atTime(0, () => {
            expect(polySynth.activeVoices.value).to.equal(5);
          }),
          atTime(0.3, () => {
            expect(polySynth.activeVoices.value).to.equal(0);
          }),
        ];
      }, 10);
    });

    it('warns when too much polyphony is attempted and notes are dropped', () => {
      warns(() => {
        return runOffline(() => {
          const polySynth = createPolySynth(create, {
            maxPolyphony: 2,
          });
          polySynth.toDestination();
          triggerAttack(polySynth, ['C4', 'D4', 'G4'], 0.1);
        }, 0.3);
      });
    });

    it.skip('reports the active notes', () => {
      return runOffline((context) => {
        const polySynth = createPolySynth(createWithOptions({ release: 0.1 }));
        polySynth.toDestination();
        polySynth.triggerAttackRelease('C4', 0.1, 0.1);
        polySynth.triggerAttackRelease('D4', 0.1, 0.2);
        polySynth.triggerAttackRelease('C4', 0.1, 0.5);
        polySynth.triggerAttackRelease('C4', 0.1, 0.6);

        // This test doesn't work since we use the internal onended method which isn't called
        // during the fake rendering process.
        return [
          atTime(0, () => {
            expect(polySynth.activeVoices.value).to.equal(4);
          }),
          atTime(0.1, () => {
            expect(polySynth.activeVoices.value).to.equal(4);
          }),
          atTime(0.2, () => {
            expect(polySynth.activeVoices.value).to.equal(4);
          }),
          atTime(0.3, () => {
            expect(polySynth.activeVoices.value).to.equal(3);
          }),
          atTime(0.4, () => {
            expect(polySynth.activeVoices.value).to.equal(2);
          }),
          atTime(0.5, () => {
            expect(polySynth.activeVoices.value).to.equal(2);
          }),
          atTime(0.6, () => {
            expect(polySynth.activeVoices.value).to.equal(2);
          }),
          atTime(0.7, () => {
            expect(polySynth.activeVoices.value).to.equal(1);
          }),
          atTime(0.8, () => {
            expect(polySynth.activeVoices.value).to.equal(0);
          }),
        ];
      }, 1);
    });

    it('can trigger another attack before the release has ended', () => {
      // compute the end time
      return runOffline(() => {
        const synth = createPolySynth(createWithOptions({ release: 0.1 }));
        synth.toDestination();
        let releaser = synth.triggerAttack('C4', 0.05);
        releaser.triggerRelease(0.1);
        releaser = synth.triggerAttack('C4', 0.15);
        releaser.triggerRelease(0.2);
      }, 1).then((buffer) => {
        expect(buffer.getTimeOfLastSound()).to.be.closeTo(0.3, 0.01);
      });
    });

    it('can trigger another attack right after the release has ended', () => {
      // compute the end time
      return runOffline(() => {
        const synth = createPolySynth(createWithOptions({ release: 0.1 }));
        synth.toDestination();
        let releaser = synth.triggerAttack('C4', 0.05);
        releaser.triggerRelease(0.1);
        releaser = synth.triggerAttack('C4', 0.2);
        releaser.triggerRelease(0.3);
        // Same as above this doesn't work in our test infrastructure
        // return atTime(0.41, () => {
        //   expect(synth.activeVoices.value).to.equal(0);
        // });
      }, 1).then((buffer) => {
        expect(buffer.getTimeOfLastSound()).to.be.closeTo(0.4, 0.01);
      });
    });
  });

});
