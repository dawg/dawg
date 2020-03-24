import { compareToFile } from '@/lib/audio/test-utils';
import { createSynth } from '@/lib/audio/synth';
import { expect } from '@/lib/testing';
import { runOffline } from '@/lib/audio/offline';

describe('ObeoSynth', () => {

  // BasicTests(Synth);
  // InstrumentTest(Synth, "C4");
  // MonophonicTest(Synth, "C4");

  it('matches a file basic', () => {
    return compareToFile(() => {
      const synth = createSynth();
      synth.toDestination();
      synth.triggerAttackRelease('C4', 0.1, 0.05);
    }, 'synth_basic.wav', 0.3);
  });

  it('matches a file melody', () => {
    return compareToFile(() => {
      const synth = createSynth();
      synth.toDestination();
      synth.triggerAttack('C4', 0);
      synth.triggerAttack('E4', 0.1, 0.5);
      synth.triggerAttackRelease('G4', 0.5, 0.3);
      synth.triggerAttackRelease('B4', 0.5, 0.5, 0.2);
    }, 'synth_melody.wav', 0.3);
  });

  context('API', () => {

    it('can get and set oscillator attributes', () => {
      const simple = createSynth();
      simple.oscillator.type = 'triangle';
      expect(simple.oscillator.type).to.equal('triangle');
      simple.dispose();
    });

    it('can get and set envelope attributes', () => {
      const simple = createSynth();
      simple.envelope.attack.value = 0.24;
      expect(simple.envelope.attack.value).to.equal(0.24);
      simple.dispose();
    });

    it('can be constructed with an options object', () => {
      const simple = createSynth({
        envelope: {
          sustain: 0.3,
        },
        oscillator: {
          type: 'sine',
        },
        volume: -5,
      });
      expect(simple.envelope.sustain.value).to.equal(0.3);
      expect(simple.oscillator.type).to.equal('sine');
      expect(simple.volume.value).to.be.closeTo(-5, 0.1);
      simple.dispose();
    });

    it('can be trigged with a Tone.Frequency', () => {
      return runOffline(() => {
        const synth = createSynth();
        synth.toDestination();
        synth.triggerAttack('C4', 0);
      }).then((buffer) => {
        expect(buffer.isSilent()).to.eq(false);
      });
    });

    it('is silent after triggerAttack if sustain is 0', () => {
      return runOffline(() => {
        const synth = createSynth({
          envelope: {
            attack: 0.1,
            decay: 0.1,
            sustain: 0,
          },
        });
        synth.toDestination();
        synth.triggerAttack('C4', 0);
      }, 0.5).then((buffer) => {
        expect(buffer.getTimeOfLastSound()).to.be.closeTo(0.2, 0.01);
      });
    });
  });

  context('Portamento', () => {
    it('can play notes with a portamento', () => {
      return runOffline(() => {
        const synth = createSynth({
          portamento: 0.1,
        });
        expect(synth.portamento).to.equal(0.1);
        synth.frequency.toDestination();
        synth.triggerAttack(440, 0);
        synth.triggerAttack(880, 0.1);
      }, 0.2).then((buffer) => {
        buffer.forEach((val, time) => {
          if (time < 0.1) {
            expect(val).to.be.closeTo(440, 1);
          } else if (time < 0.2) {
            expect(val).to.within(440, 880);
          } else {
            expect(val).to.be.closeTo(880, 1);
          }
        });
      });
    });
  });
});
