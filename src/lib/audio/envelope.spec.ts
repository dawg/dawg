import { expect } from '@/lib/testing';
import { createEnvelope } from '@/lib/audio/envelope';
import { runOffline } from '@/lib/audio/offline';

describe('ObeoEnvelope', () => {

  context('Envelope', () => {
    it('passes no signal before being triggered', () => {
      return runOffline(() => {
        createEnvelope().toDestination();
      }).then((buffer) => {
        expect(buffer.isSilent()).to.equal(true);
      });
    });

    it('passes signal once triggered', () => {
      return runOffline(() => {
        const env = createEnvelope();
        env.toDestination();
        env.triggerAttack(0.05);
        expect(env.getValueAtTime(0.05 + 0.005)).to.eq(1);
      }, 0.1).then((buffer) => {
        expect(buffer.getTimeOfFirstSound()).to.be.closeTo(0.05, 0.001);
      });
    });

    it('can take parameters as an object', () => {
      const env0 = createEnvelope({
        attack: 0,
        decay: 0.5,
        sustain: 1,
      });
      expect(env0.attack.value).to.equal(0);
      expect(env0.decay.value).to.equal(0.5);
      expect(env0.sustain.value).to.equal(1);
      env0.dispose();
    });

    it('ensures that none of the values go below 0', () => {
      const env = createEnvelope();
      expect(() => {
        env.attack.value = -1;
      }).to.throw(RangeError);

      expect(() => {
        env.decay.value = -1;
      }).to.throw(RangeError);

      expect(() => {
        env.sustain.value = 2;
      }).to.throw(RangeError);

      expect(() => {
        env.release.value = -1;
      }).to.throw(RangeError);
      env.dispose();
    });

    it('can set attack to exponential or linear', () => {
      const env = createEnvelope({ attack: 0.01, decay: 0.01, sustain: 0.5, release: 0.3 });
      env.attackCurve.value = 'exponential';
      expect(env.attackCurve.value).to.equal('exponential');
      env.triggerAttack();
      env.dispose();
      // and can be linear
      const env2 = createEnvelope({ attack: 0.01, decay: 0.01, sustain: 0.5, release: 0.3 });
      env2.attackCurve.value = 'linear';
      expect(env2.attackCurve.value).to.equal('linear');
      env2.triggerAttack();
      env2.dispose();
    });

    it('can set decay to exponential or linear', () => {
      const env = createEnvelope({ attack: 0.01, decay: 0.01, sustain: 0.5, release: 0.3 });
      env.decayCurve.value = 'exponential';
      expect(env.decayCurve.value).to.equal('exponential');
      env.triggerAttack();
      env.dispose();
      // and can be linear
      const env2 = createEnvelope({ attack: 0.01, decay: 0.01, sustain: 0.5, release: 0.3 });
      env2.decayCurve.value = 'linear';
      expect(env2.decayCurve.value).to.equal('linear');
      env2.triggerAttack();
    });

    it('can set release to exponential or linear', () => {
      const env = createEnvelope({ attack: 0.01, decay: 0.01, sustain: 0.5, release: 0.3 });
      env.releaseCurve.value = 'exponential';
      expect(env.releaseCurve.value).to.equal('exponential');
      env.triggerRelease();
      env.dispose();
      // and can be linear
      const env2 = createEnvelope({ attack: 0.01, decay: 0.01, sustain: 0.5, release: 0.3 });
      env2.releaseCurve.value = 'linear';
      expect(env2.releaseCurve.value).to.equal('linear');
      env2.triggerRelease();
      env2.dispose();
    });

    it('can set release to exponential or linear', () => {
      return runOffline(() => {
        const env = createEnvelope({
          release: 0,
        });
        env.toDestination();
        env.triggerAttackRelease(0.4, 0);
      }, 0.7).then((buffer) => {
        expect(buffer.getValueAtTime(0.3)).to.be.above(0);
        expect(buffer.getValueAtTime(0.401)).to.equal(0);
      });
    });

    it('schedule a release at the moment when the attack portion is done', () => {
      return runOffline(() => {
        const env = createEnvelope({
          attack: 0.5,
          decay: 0.0,
          sustain: 1,
          release: 0.5,
        });
        env.toDestination();
        env.triggerAttackRelease(0.5);
      }, 0.7).then((buffer) => {
        // make sure that it's got the rising edge
        expect(buffer.getValueAtTime(0.1)).to.be.closeTo(0.2, 0.01);
        expect(buffer.getValueAtTime(0.2)).to.be.closeTo(0.4, 0.01);
        expect(buffer.getValueAtTime(0.3)).to.be.closeTo(0.6, 0.01);
        expect(buffer.getValueAtTime(0.4)).to.be.closeTo(0.8, 0.01);
        expect(buffer.getValueAtTime(0.5)).to.be.be.closeTo(1, 0.001);
      });
    });

    it('correctly schedules an exponential attack', () => {
      const e = {
        attack: 0.01,
        decay: 0.4,
        release: 0.1,
        sustain: 0.5,
      };
      return runOffline(() => {
        const env = createEnvelope({ attack: e.attack, decay: e.decay, sustain: e.sustain, release: e.release });
        env.attackCurve.value = 'exponential';
        env.toDestination();
        env.triggerAttack(0);
      }, 0.7).then((buffer) => {
        buffer.forEachBetween((sample) => {
          expect(sample).to.be.within(0, 1);
        }, 0, e.attack);
        buffer.forEachBetween((sample) => {
          expect(sample).to.be.within(e.sustain - 0.001, 1);
        }, e.attack, e.attack + e.decay);
        buffer.forEachBetween((sample) => {
          expect(sample).to.be.closeTo(e.sustain, 0.01);
        }, e.attack + e.decay);
      });
    });

    it('correctly schedules a linear release', () => {
      const e = {
        attack: 0.01,
        decay: 0.4,
        release: 0.1,
        sustain: 0.5,
      };
      return runOffline(() => {
        const env = createEnvelope({ attack: e.attack, decay: e.decay, sustain: e.sustain, release: e.release });
        env.attackCurve.value = 'exponential';
        env.toDestination();
        env.triggerAttack(0);
      }, 0.7).then((buffer) => {
        buffer.forEachBetween((sample, time) => {
          const target = 1 - (time - 0.2) * 10;
          expect(sample).to.be.closeTo(target, 0.01);
        }, 0.2, 0.2);
      });
    });

    it('correctly schedules a linear decay', () => {
      const e = {
        attack: 0.1,
        decay: 0.5,
        release: 0.1,
        sustain: 0,
      };
      return runOffline(() => {
        const env = createEnvelope({ attack: e.attack, decay: e.decay, sustain: e.sustain, release: e.release });
        env.decayCurve.value = 'linear';
        env.toDestination();
        env.triggerAttack(0);
      }, 0.7).then((buffer) => {
        expect(buffer.getValueAtTime(0.05)).to.be.closeTo(0.5, 0.01);
        expect(buffer.getValueAtTime(0.1)).to.be.closeTo(1, 0.01);
        expect(buffer.getValueAtTime(0.2)).to.be.closeTo(0.8, 0.01);
        expect(buffer.getValueAtTime(0.3)).to.be.closeTo(0.6, 0.01);
        expect(buffer.getValueAtTime(0.4)).to.be.closeTo(0.4, 0.01);
        expect(buffer.getValueAtTime(0.5)).to.be.closeTo(0.2, 0.01);
        expect(buffer.getValueAtTime(0.6)).to.be.closeTo(0, 0.01);
      });
    });

    it('correctly schedules an exponential decay', () => {
      const e = {
        attack: 0.1,
        decay: 0.5,
        release: 0.1,
        sustain: 0,
      };
      return runOffline(() => {
        const env = createEnvelope({ attack: e.attack, decay: e.decay, sustain: e.sustain, release: e.release });
        env.decayCurve.value = 'exponential';
        env.toDestination();
        env.triggerAttack(0);
      }, 0.7).then((buffer) => {
        expect(buffer.getValueAtTime(0.1)).to.be.closeTo(1, 0.01);
        expect(buffer.getValueAtTime(0.2)).to.be.closeTo(0.27, 0.01);
        expect(buffer.getValueAtTime(0.3)).to.be.closeTo(0.07, 0.01);
        expect(buffer.getValueAtTime(0.4)).to.be.closeTo(0.02, 0.01);
        expect(buffer.getValueAtTime(0.5)).to.be.closeTo(0.005, 0.01);
        expect(buffer.getValueAtTime(0.6)).to.be.closeTo(0, 0.01);
      });
    });

    it('can schedule a very short attack', () => {
      const e = {
        attack: 0.001,
        decay: 0.01,
        release: 0.1,
        sustain: 0.1,
      };
      return runOffline(() => {
        const env = createEnvelope({ attack: e.attack, decay: e.decay, sustain: e.sustain, release: e.release });
        env.attackCurve.value = 'exponential';
        env.toDestination();
        env.triggerAttack(0);
      }, 0.2).then((buffer) => {
        buffer.forEachBetween((sample) => {
          expect(sample).to.be.within(0, 1);
        }, 0, e.attack);
        buffer.forEachBetween((sample) => {
          expect(sample).to.be.within(e.sustain - 0.001, 1);
        }, e.attack, e.attack + e.decay);
        buffer.forEachBetween((sample) => {
          expect(sample).to.be.closeTo(e.sustain, 0.01);
        }, e.attack + e.decay);
      });
    });

    it('can schedule an attack of time 0', () => {
      return runOffline(() => {
        const env = createEnvelope({ attack: 0, decay: 0.1 });
        env.toDestination();
        env.triggerAttack(0.1);
      }, 0.2).then((buffer) => {
        expect(buffer.getValueAtTime(0)).to.be.closeTo(0, 0.001);
        expect(buffer.getValueAtTime(0.0999)).to.be.closeTo(0, 0.001);
        expect(buffer.getValueAtTime(0.1)).to.be.closeTo(1, 0.001);
      });
    });

    it('correctly schedule a release', () => {
      const e = {
        attack: 0.001,
        decay: 0.01,
        release: 0.3,
        sustain: 0.5,
      };
      const releaseTime = 0.2;
      return runOffline(() => {
        const env = createEnvelope({ attack: e.attack, decay: e.decay, sustain: e.sustain, release: e.release });
        env.attackCurve.value = 'exponential';
        env.toDestination();
        env.triggerAttackRelease(releaseTime);
      }, 0.6).then((buffer) => {
        const sustainStart = e.attack + e.decay;
        const sustainEnd = sustainStart + releaseTime;
        buffer.forEachBetween((sample) => {
          expect(sample).to.be.below(e.sustain + 0.01);
        }, sustainStart, sustainEnd);
        buffer.forEachBetween((sample) => {
          expect(sample).to.be.closeTo(0, 0.01);
        }, releaseTime + e.release);
      });
    });

    it('can re-trigger a short attack at the same time as previous release', () => {
      return runOffline(() => {
        const env = createEnvelope({ attack: 0.001, decay: 0.1, sustain: 0.5 });
        env.attackCurve.value = 'linear';
        env.toDestination();
        env.triggerAttack(0);
        expect(env.getValueAtTime(0.0005)).be.closeTo(0.5, 0.01);
        expect(env.getValueAtTime(0.001)).be.closeTo(1, 0.01);

        env.triggerRelease(0.4);
        env.triggerAttack(0.4);
      }, 0.6).then((buffer) => {
        expect(buffer.getValueAtTime(0.0005)).be.closeTo(0.5, 0.025);
        expect(buffer.getValueAtTime(0.001)).be.closeTo(1, 0.01);
        expect(buffer.getValueAtTime(0.4)).be.closeTo(0.5, 0.01);
        expect(buffer.getValueAtTime(0.40025)).be.closeTo(0.75, 0.025);
        expect(buffer.getValueAtTime(0.4005)).be.closeTo(1, 0.01);
      });
    });

    it('is silent before and after triggering', () => {
      const e = {
        attack: 0.001,
        decay: 0.01,
        release: 0.3,
        sustain: 0.5,
      };
      const releaseTime = 0.2;
      const attackTime = 0.1;
      return runOffline(() => {
        const env = createEnvelope({ attack: e.attack, decay: e.decay, sustain: e.sustain, release: e.release });
        env.attackCurve.value = 'exponential';
        env.toDestination();
        env.triggerAttack(attackTime);
        env.triggerRelease(releaseTime);
      }, 0.6).then((buffer) => {
        expect(buffer.getValueAtTime(attackTime - 0.001)).to.equal(0);
        expect(buffer.getValueAtTime(e.attack + e.decay + releaseTime + e.release)).to.be.below(0.01);
      });
    });

    it('is silent after decay if sustain is 0', () => {
      const e = {
        attack: 0.01,
        decay: 0.04,
        sustain: 0,
      };
      const attackTime = 0.1;
      return runOffline(() => {
        const env = createEnvelope({ attack: e.attack, decay: e.decay, sustain: e.sustain });
        env.toDestination();
        env.triggerAttack(attackTime);
      }, 0.4).then((buffer) => {
        buffer.forEach((sample, time) => {
          expect(buffer.getValueAtTime(attackTime - 0.001)).to.equal(0);
          expect(buffer.getValueAtTime(attackTime + e.attack + e.decay)).to.be.below(0.01);
        });
      });
    });

    it('correctly schedule an attack release envelope', () => {
      const e = {
        attack: 0.08,
        decay: 0.2,
        release: 0.2,
        sustain: 0.1,
      };
      const releaseTime = 0.4;
      return runOffline(() => {
        const env = createEnvelope({ attack: e.attack, decay: e.decay, sustain: e.sustain, release: e.release });
        env.toDestination();
        env.triggerAttack(0);
        env.triggerRelease(releaseTime);
      }).then((buffer) => {
        buffer.forEach((sample, time) => {
          if (time < e.attack) {
            expect(sample).to.be.within(0, 1);
          } else if (time < e.attack + e.decay) {
            expect(sample).to.be.within(e.sustain, 1);
          } else if (time < releaseTime) {
            expect(sample).to.be.closeTo(e.sustain, 0.1);
          } else if (time < releaseTime + e.release) {
            expect(sample).to.be.within(0, e.sustain + 0.01);
          } else {
            expect(sample).to.be.below(0.0001);
          }
        });
      });
    });

    it('can schedule a combined AttackRelease', () => {
      const e = {
        attack: 0.1,
        decay: 0.2,
        release: 0.1,
        sustain: 0.35,
      };
      const releaseTime = 0.4;
      const duration = 0.4;
      return runOffline(() => {
        const env = createEnvelope({ attack: e.attack, decay: e.decay, sustain: e.sustain, release: e.release });
        env.toDestination();
        env.triggerAttack(0);
        env.triggerRelease(releaseTime);
      }, 0.7).then((buffer) => {
        buffer.forEach((sample, time) => {
          if (time < e.attack) {
            expect(sample).to.be.within(0, 1);
          } else if (time < e.attack + e.decay) {
            expect(sample).to.be.within(e.sustain - 0.001, 1);
          } else if (time < duration) {
            expect(sample).to.be.closeTo(e.sustain, 0.1);
          } else if (time < duration + e.release) {
            expect(sample).to.be.within(0, e.sustain + 0.01);
          } else {
            expect(sample).to.be.below(0.0015);
          }
        });
      });
    });

    it('can schedule a combined AttackRelease with velocity', () => {
      const e = {
        attack: 0.1,
        decay: 0.2,
        release: 0.1,
        sustain: 0.35,
      };
      const releaseTime = 0.4;
      const duration = 0.4;
      const velocity = 0.4;
      return runOffline(() => {
        const env = createEnvelope({ attack: e.attack, decay: e.decay, sustain: e.sustain, release: e.release });
        env.toDestination();
        env.triggerAttack(0, velocity);
        env.triggerRelease(releaseTime);
      }, 0.7).then((buffer) => {
        buffer.forEach((sample, time) => {
          if (time < e.attack) {
            expect(sample).to.be.within(0, velocity + 0.01);
          } else if (time < e.attack + e.decay) {
            expect(sample).to.be.within(e.sustain * velocity - 0.01, velocity + 0.01);
          } else if (time < duration) {
            expect(sample).to.be.closeTo(e.sustain * velocity, 0.1);
          } else if (time < duration + e.release) {
            expect(sample).to.be.within(0, e.sustain * velocity + 0.01);
          } else {
            expect(sample).to.be.below(0.01);
          }
        });
      });
    });

    it('can schedule multiple envelopes', () => {
      const e = {
        attack: 0.1,
        decay: 0.2,
        release: 0.1,
        sustain: 0.0,
      };
      return runOffline(() => {
        const env = createEnvelope({ attack: e.attack, decay: e.decay, sustain: e.sustain, release: e.release });
        env.toDestination();
        env.triggerAttack(0);
        env.triggerAttack(0.5);
      }, 0.85).then((buffer) => {
        // first trigger
        expect(buffer.getValueAtTime(0)).to.be.closeTo(0, 0.01);
        expect(buffer.getValueAtTime(0.1)).to.be.closeTo(1, 0.01);
        expect(buffer.getValueAtTime(0.3)).to.be.closeTo(0, 0.01);
        // second trigger
        expect(buffer.getValueAtTime(0.5)).to.be.closeTo(0, 0.01);
        expect(buffer.getValueAtTime(0.6)).to.be.closeTo(1, 0.01);
        expect(buffer.getValueAtTime(0.8)).to.be.closeTo(0, 0.01);
      });
    });

    it('can schedule multiple attack/releases with no discontinuities', () => {
      return runOffline(() => {
        const env = createEnvelope({ attack: 0.1, decay: 0.2, sustain: 0.2, release: 0.4 });
        env.toDestination();
        env.triggerAttackRelease(0, 0.4);
        env.triggerAttackRelease(0.4, 0.11);
        env.triggerAttackRelease(0.45, 0.1);
        env.triggerAttackRelease(1.1, 0.09);
        env.triggerAttackRelease(1.5, 0.3);
        env.triggerAttackRelease(1.8, 0.29);
      }, 2).then((buffer) => {
        // test for discontinuities
        let lastSample = 0;
        buffer.forEach((sample, time) => {
          expect(sample).to.be.at.most(1);
          const diff = Math.abs(lastSample - sample);
          expect(diff).to.be.lessThan(0.001);
          lastSample = sample;
        });
      });
    });

    it('can schedule multiple \'linear\' attack/releases with no discontinuities', () => {
      return runOffline(() => {
        const env = createEnvelope({ attack: 0.1, decay: 0.2, sustain: 0.2, release: 0.4 });
        env.toDestination();
        env.attackCurve.value = 'linear';
        env.releaseCurve.value = 'linear';
        env.triggerAttackRelease(0, 0.4);
        env.triggerAttackRelease(0.4, 0.11);
        env.triggerAttackRelease(0.45, 0.1);
        env.triggerAttackRelease(1.1, 0.09);
        env.triggerAttackRelease(1.5, 0.3);
        env.triggerAttackRelease(1.8, 0.29);
      }, 2).then((buffer) => {
        // test for discontinuities
        let lastSample = 0;
        buffer.forEach((sample, time) => {
          expect(sample).to.be.at.most(1);
          const diff = Math.abs(lastSample - sample);
          expect(diff).to.be.lessThan(0.001);
          lastSample = sample;
        });
      });
    });

    it('can schedule multiple \'exponential\' attack/releases with no discontinuities', () => {
      return runOffline(() => {
        const env = createEnvelope({ attack: 0.1, decay: 0.2, sustain: 0.2, release: 0.4 });
        env.toDestination();
        env.attackCurve.value = 'exponential';
        env.releaseCurve.value = 'exponential';
        env.triggerAttackRelease(0, 0.4);
        env.triggerAttackRelease(0.4, 0.11);
        env.triggerAttackRelease(0.45, 0.1);
        env.triggerAttackRelease(1.1, 0.09);
        env.triggerAttackRelease(1.5, 0.3);
        env.triggerAttackRelease(1.8, 0.29);
      }, 2).then((buffer) => {
        // test for discontinuities
        let lastSample = 0;
        buffer.forEach((sample, time) => {
          expect(sample).to.be.at.most(1);
          const diff = Math.abs(lastSample - sample);
          expect(diff).to.be.lessThan(0.0035);
          lastSample = sample;
        });
      });
    });

    it.skip('can schedule multiple \'sine\' attack/releases with no discontinuities', () => {
      return runOffline(() => {
        const env = createEnvelope({ attack: 0.1, decay: 0.2, sustain: 0.2, release: 0.4 });
        env.toDestination();
        // FIXME add these back when ready
        // env.attackCurve.value = 'sine';
        // env.releaseCurve.value = 'sine';
        env.triggerAttackRelease(0, 0.4);
        env.triggerAttackRelease(0.4, 0.11);
        env.triggerAttackRelease(0.45, 0.1);
        env.triggerAttackRelease(1.1, 0.09);
        env.triggerAttackRelease(1.5, 0.3);
        env.triggerAttackRelease(1.8, 0.29);
      }, 2).then((buffer) => {
        // test for discontinuities
        let lastSample = 0;
        buffer.forEach((sample, time) => {
          expect(sample).to.be.at.most(1);
          const diff = Math.abs(lastSample - sample);
          expect(diff).to.be.lessThan(0.0035);
          lastSample = sample;
        });
      });
    });

    it.skip('can schedule multiple \'cosine\' attack/releases with no discontinuities', () => {
      return runOffline(() => {
        const env = createEnvelope({ attack: 0.1, decay: 0.2, sustain: 0.2, release: 0.4 });
        env.toDestination();
        // FIXME add these back when ready
        // env.attackCurve.value = 'cosine';
        // env.releaseCurve.value = 'cosine';
        env.triggerAttackRelease(0, 0.4);
        env.triggerAttackRelease(0.4, 0.11);
        env.triggerAttackRelease(0.45, 0.1);
        env.triggerAttackRelease(1.1, 0.09);
        env.triggerAttackRelease(1.5, 0.3);
        env.triggerAttackRelease(1.8, 0.29);
      }, 2).then((buffer) => {
        // test for discontinuities
        let lastSample = 0;
        buffer.forEach((sample, time) => {
          expect(sample).to.be.at.most(1);
          const diff = Math.abs(lastSample - sample);
          expect(diff).to.be.lessThan(0.002);
          lastSample = sample;
        });
      });
    });

    it('reports its current envelope value (.value)', () => {
      return runOffline(() => {
        const env = createEnvelope({ attack: 1, decay: 0.2, sustain: 1 });
        env.toDestination();
        expect(env.value.value).to.be.closeTo(0, 0.01);
        env.triggerAttack();
        return (time) => {
          expect(env.value.value).to.be.closeTo(time, 0.01);
        };
      }, 0.5);
    });

    it('can cancel a schedule envelope', () => {
      return runOffline(() => {
        const env = createEnvelope({ attack: 0.1, decay: 0.2, sustain: 1 });
        env.toDestination();
        env.triggerAttack(0.2);
        env.cancel(0.2);
      }, 0.3).then((buffer) => {
        expect(buffer.isSilent()).to.eq(true);
      });
    });
  });

  context('Attack/Release Curves', () => {
    it('outputs a signal when the attack/release curves are set to an array', () => {
      return runOffline(() => {
        const env = createEnvelope({
          attack: 0.3,
          attackCurve: [0, 1, 0, 1],
          decay: 0,
          release: 0.3,
          releaseCurve: [1, 0, 1, 0],
          sustain: 1,
        });
        env.toDestination();

        expect(env.attackCurve.value).to.deep.equal([0, 1, 0, 1]);
        env.triggerAttackRelease(0.3, 0.1);
      }, 0.8).then((buffer) => {
        buffer.forEach((sample, time) => {
          if (time > 0.4 && time < 0.5) {
            expect(sample).to.be.above(0);
          } else if (time < 0.1) {
            expect(sample).to.equal(0);
          }
        });
      });
    });

    it('can scale a velocity with a custom curve', () => {
      return runOffline(() => {
        const env = createEnvelope({
          attack: 0.3,
          attackCurve: [0, 1, 0, 1],
          decay: 0,
          release: 0.3,
          releaseCurve: [1, 0, 1, 0],
          sustain: 1,
        });
        env.toDestination();
        env.triggerAttackRelease(0.4, 0.1, 0.5);
      }, 0.8).then((buffer) => {
        buffer.forEach((sample) => {
          expect(sample).to.be.at.most(0.51);
        });
      });
    });

    it('can render the envelope to a curve', async () => {
      const env = createEnvelope();
      const curve = await env.asArray();
      expect(curve.some((v) => v > 0)).to.eq(true);
      curve.forEach((v) => expect(v).to.be.within(0, 1));
      env.dispose();
    });

    it('can render the envelope to an array with a given length', async () => {
      const env = createEnvelope();
      const curve = await env.asArray(256);
      expect(curve.length).to.equal(256);
      env.dispose();
    });
  });

});
