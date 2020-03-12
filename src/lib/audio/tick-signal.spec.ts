import { expect } from '@/lib/testing';
import { runOffline } from '@/lib/audio/offline';
import { createTickSignal } from '@/lib/audio/tick-signal';
import { createDestination } from '@/lib/audio/destination';

describe('ObeoTickSignal', () => {
  it('can initialize', async () => {
    await runOffline((context) => {
      // 120 BPM -> 2 BPS -> frequency (ie ticks per second)
      // This will be used in the other tests
      const frequency = context.beatsToTicks(120 / 60);
      const param = createTickSignal({ value: frequency });
      expect(param.offset.getTimeOfTick(0)).to.eq(0);
    });
  });

  it('can schedule a change in the future', () => {
    const tickSignal = createTickSignal({ value: 1 });
    tickSignal.offset.setValueAtTime(2, 0.2);
    tickSignal.dispose();
  });

  it('can schedule a ramp in the future', () => {
    const tickSignal = createTickSignal({ value: 1 });
    tickSignal.offset.setValueAtTime(2, 0);
    tickSignal.offset.linearRampToValueAtTime(0.1, 0.2);
    tickSignal.offset.exponentialRampToValueAtTime(1, 0.4);
    tickSignal.dispose();
  });

  it('calculates the ticks when no changes are scheduled', () => {
    const tickSignal0 = createTickSignal({ value: 2 });
    expect(tickSignal0.offset.getTicksAtTime(1)).to.be.closeTo(2, 0.01);
    expect(tickSignal0.offset.getTicksAtTime(2)).to.be.closeTo(4, 0.01);
    expect(tickSignal0.offset.getTimeOfTick(4)).to.be.closeTo(2, 0.01);
    tickSignal0.dispose();

    const tickSignal1 = createTickSignal({ value: 1 });
    expect(tickSignal1.offset.getTicksAtTime(1)).to.be.closeTo(1, 0.01);
    expect(tickSignal1.offset.getTicksAtTime(2)).to.be.closeTo(2, 0.01);
    expect(tickSignal1.offset.getTimeOfTick(2)).to.be.closeTo(2, 0.01);
    tickSignal1.dispose();
  });

  it('calculates the ticks in the future when a setValueAtTime is scheduled', () => {
    const tickSignal = createTickSignal({ value: 1 });
    tickSignal.offset.setValueAtTime(2, 0.5);
    expect(tickSignal.offset.getTicksAtTime(0)).to.be.closeTo(0, 0.01);
    expect(tickSignal.offset.getTicksAtTime(0.5)).to.be.closeTo(0.5, 0.01);
    expect(tickSignal.offset.getTicksAtTime(0.75)).to.be.closeTo(1, 0.01);
    expect(tickSignal.offset.getTicksAtTime(1)).to.be.closeTo(1.5, 0.01);
    expect(tickSignal.offset.getTimeOfTick(1.5)).to.be.closeTo(1, 0.01);
    tickSignal.dispose();
  });

  it('calculates the ticks in the future when multiple setValueAtTime are scheduled', () => {
    const tickSignal = createTickSignal({ value: 1 });
    tickSignal.offset.setValueAtTime(2, 1);
    tickSignal.offset.setValueAtTime(4, 2);
    expect(tickSignal.offset.getTicksAtTime(0)).to.be.closeTo(0, 0.01);
    expect(tickSignal.offset.getTicksAtTime(0.5)).to.be.closeTo(0.5, 0.01);
    expect(tickSignal.offset.getTicksAtTime(1)).to.be.closeTo(1, 0.01);
    expect(tickSignal.offset.getTicksAtTime(1.5)).to.be.closeTo(2, 0.01);
    expect(tickSignal.offset.getTicksAtTime(2)).to.be.closeTo(3, 0.01);
    expect(tickSignal.offset.getTicksAtTime(2.5)).to.be.closeTo(5, 0.01);
    expect(tickSignal.offset.getTicksAtTime(3)).to.be.closeTo(7, 0.01);
    expect(tickSignal.offset.getTimeOfTick(7)).to.be.closeTo(3, 0.01);
    tickSignal.dispose();
  });

  it('if ticks are 0, getTicksAtTime will return 0', () => {
    const tickSignal = createTickSignal({ value: 0 });
    tickSignal.offset.setValueAtTime(0, 1);
    tickSignal.offset.linearRampToValueAtTime(0, 2);
    expect(tickSignal.offset.getTicksAtTime(0)).to.equal(0);
    expect(tickSignal.offset.getTicksAtTime(1)).to.equal(0);
    expect(tickSignal.offset.getTicksAtTime(2)).to.equal(0);
    expect(tickSignal.offset.getTicksAtTime(3)).to.equal(0);
    tickSignal.dispose();
  });

  it('calculates the ticks in the future when a linearRampToValueAtTime is scheduled', () => {
    const tickSignal = createTickSignal({ value: 1 });
    tickSignal.offset.setValueAtTime(1, 0);
    tickSignal.offset.linearRampToValueAtTime(2, 1);
    expect(tickSignal.offset.getTicksAtTime(0)).to.be.closeTo(0, 0.01);
    expect(tickSignal.offset.getTicksAtTime(0.5)).to.be.closeTo(0.62, 0.01);
    expect(tickSignal.offset.getTicksAtTime(1)).to.be.closeTo(1.5, 0.01);
    expect(tickSignal.offset.getTicksAtTime(2)).to.be.closeTo(3.5, 0.01);
    tickSignal.dispose();
  });

  it('calculates the ticks in the future when multiple linearRampToValueAtTime are scheduled', () => {
    const tickSignal = createTickSignal({ value: 1 });
    tickSignal.offset.setValueAtTime(1, 0);
    tickSignal.offset.linearRampToValueAtTime(2, 1);
    tickSignal.offset.linearRampToValueAtTime(0, 2);
    expect(tickSignal.offset.getTicksAtTime(0)).to.be.closeTo(0, 0.01);
    expect(tickSignal.offset.getTicksAtTime(0.5)).to.be.closeTo(0.62, 0.01);
    expect(tickSignal.offset.getTicksAtTime(1)).to.be.closeTo(1.5, 0.01);
    expect(tickSignal.offset.getTicksAtTime(2)).to.be.closeTo(2.5, 0.01);
    expect(tickSignal.offset.getTicksAtTime(3)).to.be.closeTo(2.5, 0.01);
    tickSignal.dispose();
  });

  it('calculates the ticks in the future when a exponentialRampToValueAtTime is scheduled', () => {
    const tickSignal = createTickSignal({ value: 1 });
    tickSignal.offset.setValueAtTime(1, 0);
    tickSignal.offset.exponentialRampToValueAtTime(2, 1);
    expect(tickSignal.offset.getTicksAtTime(0)).to.be.closeTo(0, 0.01);
    expect(tickSignal.offset.getTicksAtTime(0.5)).to.be.closeTo(0.6, 0.01);
    expect(tickSignal.offset.getTicksAtTime(1)).to.be.closeTo(1.5, 0.1);
    expect(tickSignal.offset.getTicksAtTime(2)).to.be.closeTo(3.5, 0.1);
    expect(tickSignal.offset.getTicksAtTime(3)).to.be.closeTo(5.5, 0.1);
    tickSignal.dispose();
  });

  it('calculates the ticks in the future when multiple exponentialRampToValueAtTime are scheduled', () => {
    const tickSignal = createTickSignal({ value: 1 });
    tickSignal.offset.setValueAtTime(1, 0);
    tickSignal.offset.exponentialRampToValueAtTime(2, 1);
    tickSignal.offset.exponentialRampToValueAtTime(0, 2);
    expect(tickSignal.offset.getTicksAtTime(0)).to.be.closeTo(0, 0.01);
    expect(tickSignal.offset.getTicksAtTime(0.5)).to.be.closeTo(0.6, 0.01);
    expect(tickSignal.offset.getTicksAtTime(1)).to.be.closeTo(1.5, 0.1);
    expect(tickSignal.offset.getTicksAtTime(2)).to.be.closeTo(1.54, 0.1);
    expect(tickSignal.offset.getTicksAtTime(3)).to.be.closeTo(1.54, 0.1);
    tickSignal.dispose();
  });

  it('computes the time of a given tick when setTargetAtTime is scheduled', () => {
    const tickSignal = createTickSignal({ value: 1 });
    tickSignal.offset.setTargetAtTime(0.5, 0, 0.1);
    expect(tickSignal.offset.getTimeOfTick(0)).to.be.closeTo(0, 0.01);
    expect(tickSignal.offset.getTimeOfTick(1)).to.be.closeTo(1.89, 0.01);
    expect(tickSignal.offset.getTimeOfTick(2)).to.be.closeTo(3.89, 0.01);
    tickSignal.dispose();
  });

  it('computes the time of a given tick when multiple setTargetAtTime are scheduled', () => {
    const tickSignal = createTickSignal({ value: 1 });
    tickSignal.offset.setTargetAtTime(0.5, 0, 0.1);
    tickSignal.offset.setTargetAtTime(2, 1, 1);
    expect(tickSignal.offset.getTimeOfTick(0)).to.be.closeTo(0, 0.01);
    expect(tickSignal.offset.getTimeOfTick(1)).to.be.closeTo(1.5, 0.1);
    expect(tickSignal.offset.getTimeOfTick(2)).to.be.closeTo(2.28, 0.1);
    tickSignal.dispose();
  });

  it('computes the time of a given tick when nothing is scheduled', () => {
    const tickSignal0 = createTickSignal({ value: 1 });
    expect(tickSignal0.offset.getTimeOfTick(0)).to.be.closeTo(0, 0.01);
    expect(tickSignal0.offset.getTimeOfTick(1)).to.be.closeTo(1, 0.01);
    expect(tickSignal0.offset.getTimeOfTick(2)).to.be.closeTo(2, 0.01);
    expect(tickSignal0.offset.getTimeOfTick(3)).to.be.closeTo(3, 0.01);
    tickSignal0.dispose();

    const tickSigna1 = createTickSignal({ value: 2 });
    expect(tickSigna1.offset.getTimeOfTick(0)).to.be.closeTo(0, 0.01);
    expect(tickSigna1.offset.getTimeOfTick(1)).to.be.closeTo(0.5, 0.01);
    expect(tickSigna1.offset.getTimeOfTick(2)).to.be.closeTo(1, 0.01);
    expect(tickSigna1.offset.getTimeOfTick(3)).to.be.closeTo(1.5, 0.01);
    tickSigna1.dispose();
  });

  it('computes the time of a given tick when setValueAtTime is scheduled', () => {
    const tickSignal = createTickSignal({ value: 1 });
    tickSignal.offset.setValueAtTime(0.5, 1);
    expect(tickSignal.offset.getTimeOfTick(0)).to.be.closeTo(0, 0.01);
    expect(tickSignal.offset.getTimeOfTick(1)).to.be.closeTo(1, 0.01);
    expect(tickSignal.offset.getTimeOfTick(2)).to.be.closeTo(3, 0.01);
    expect(tickSignal.offset.getTimeOfTick(3)).to.be.closeTo(5, 0.01);
    tickSignal.dispose();
  });

  it('returns Infinity if the tick interval is 0', () => {
    const tickSignal = createTickSignal({ value: 0 });
    expect(tickSignal.offset.getTimeOfTick(1)).to.equal(Infinity);
    tickSignal.dispose();
  });

  it('computes the time of a given tick when multiple setValueAtTime are scheduled', () => {
    const tickSignal = createTickSignal({ value: 1 });
    tickSignal.offset.setValueAtTime(0.5, 1);
    tickSignal.offset.setValueAtTime(0, 2);
    expect(tickSignal.offset.getTimeOfTick(0)).to.be.closeTo(0, 0.01);
    expect(tickSignal.offset.getTimeOfTick(1)).to.be.closeTo(1, 0.01);
    expect(tickSignal.offset.getTimeOfTick(1.499)).to.be.closeTo(2, 0.01);
    expect(tickSignal.offset.getTimeOfTick(2)).to.equal(Infinity);
    tickSignal.dispose();
  });

  it('computes the time of a given tick when a linearRampToValueAtTime is scheduled', () => {
    const tickSignal = createTickSignal({ value: 1 });
    tickSignal.offset.setValueAtTime(1, 0);
    tickSignal.offset.linearRampToValueAtTime(2, 1);
    expect(tickSignal.offset.getTimeOfTick(0)).to.be.closeTo(0, 0.01);
    expect(tickSignal.offset.getTimeOfTick(1)).to.be.closeTo(0.75, 0.1);
    expect(tickSignal.offset.getTimeOfTick(2)).to.be.closeTo(1.25, 0.1);
    expect(tickSignal.offset.getTimeOfTick(3)).to.be.closeTo(1.75, 0.1);
    tickSignal.dispose();
  });

  it('computes the time of a given tick when multiple linearRampToValueAtTime are scheduled', () => {
    const tickSignal = createTickSignal({ value: 1 });
    tickSignal.offset.setValueAtTime(1, 0);
    tickSignal.offset.linearRampToValueAtTime(2, 1);
    tickSignal.offset.linearRampToValueAtTime(0, 2);
    expect(tickSignal.offset.getTimeOfTick(0)).to.be.closeTo(0, 0.1);
    expect(tickSignal.offset.getTimeOfTick(1)).to.be.closeTo(0.75, 0.1);
    expect(tickSignal.offset.getTimeOfTick(2)).to.be.closeTo(1.25, 0.1);
    expect(tickSignal.offset.getTimeOfTick(3)).to.equal(Infinity);
    tickSignal.dispose();
  });

  it('computes the time of a given tick when a exponentialRampToValueAtTime is scheduled', () => {
    const tickSignal = createTickSignal({ value: 1 });
    tickSignal.offset.exponentialRampToValueAtTime(2, 1);
    expect(tickSignal.offset.getTimeOfTick(0)).to.be.closeTo(0, 0.01);
    expect(tickSignal.offset.getTimeOfTick(2)).to.be.closeTo(1.25, 0.1);
    expect(tickSignal.offset.getTimeOfTick(3)).to.be.closeTo(1.75, 0.1);
    tickSignal.dispose();
  });

  it('computes the time of a given tick when multiple exponentialRampToValueAtTime are scheduled', () => {
    const tickSignal = createTickSignal({ value: 1 });
    tickSignal.offset.setValueAtTime(1, 0);
    tickSignal.offset.exponentialRampToValueAtTime(2, 1);
    tickSignal.offset.exponentialRampToValueAtTime(0, 2);
    expect(tickSignal.offset.getTimeOfTick(0)).to.be.closeTo(0, 0.01);
    expect(tickSignal.offset.getTimeOfTick(0.5)).to.be.closeTo(0.5, 0.1);
    expect(tickSignal.offset.getTimeOfTick(1.5)).to.be.closeTo(1, 0.1);
    expect(tickSignal.offset.getTimeOfTick(3)).to.equal(Infinity);
    tickSignal.dispose();
  });

  it('can schedule multiple types of curves', () => {
    const tickSignal = createTickSignal({ value: 1 });
    tickSignal.offset.setValueAtTime(1, 0);
    tickSignal.offset.exponentialRampToValueAtTime(4, 1);
    tickSignal.offset.linearRampToValueAtTime(0.2, 2);
    tickSignal.offset.setValueAtTime(2, 3);
    tickSignal.offset.linearRampToValueAtTime(2, 4);
    tickSignal.offset.setTargetAtTime(8, 5, 0.2);

    for (let time = 0; time < 5; time += 0.2) {
      const tick = tickSignal.offset.getTicksAtTime(time);
      expect(tickSignal.offset.getTimeOfTick(tick)).to.be.closeTo(time, 0.1);
    }

    tickSignal.dispose();
  });

  it('can get the duration of a tick at any point in time', () => {
    const tickSignal = createTickSignal({ value: 1 });
    tickSignal.offset.setValueAtTime(2, 1);
    tickSignal.offset.setValueAtTime(10, 2);
    expect(tickSignal.offset.getDurationOfTicks(1, 0)).to.be.closeTo(1, 0.01);
    expect(tickSignal.offset.getDurationOfTicks(1, 1)).to.be.closeTo(0.5, 0.01);
    expect(tickSignal.offset.getDurationOfTicks(1, 2)).to.be.closeTo(0.1, 0.01);
    expect(tickSignal.offset.getDurationOfTicks(2, 1.5)).to.be.closeTo(0.6, 0.01);
  });

  context('BPM / PPQ', () => {
    it('outputs a signal', async () => {
      const buffer = await runOffline((context) => {
        const destination = createDestination({ context });
        const tickSignal = createTickSignal({ value: 1 });
        tickSignal.connect(destination);
        tickSignal.offset.linearRampTo(3, 1, 0);
      }, { duration: 1.01 });
      expect(buffer.getValueAtTime(0)).to.be.closeTo(1, 0.01);
      expect(buffer.getValueAtTime(0.5)).to.be.closeTo(2, 0.01);
      expect(buffer.getValueAtTime(1)).to.be.closeTo(3, 0.01);
    });

    context('Ticks <-> Time', () => {

      it('converts from time to ticks', () => {
        return runOffline(() => {
          const tickSignal = createTickSignal({ value: 20 });
          expect(tickSignal.offset.ticksToTime(20, 0).valueOf()).to.be.closeTo(1, 0.01);
          expect(tickSignal.offset.ticksToTime(10, 0).valueOf()).to.be.closeTo(0.5, 0.01);
          expect(tickSignal.offset.ticksToTime(10, 10).valueOf()).to.be.closeTo(0.5, 0.01);
          tickSignal.dispose();
        });
      });

      it('converts from time to ticks with a linear ramp on the tempo', () => {
        return runOffline(() => {
          const tickSignal = createTickSignal({ value: 1 });
          tickSignal.offset.linearRampTo(2, 2, 1);
          expect(tickSignal.offset.ticksToTime(1, 0).valueOf()).to.be.closeTo(1, 0.01);
          expect(tickSignal.offset.ticksToTime(1, 1).valueOf()).to.be.closeTo(0.82, 0.01);
          expect(tickSignal.offset.ticksToTime(2, 0).valueOf()).to.be.closeTo(1.82, 0.01);
          expect(tickSignal.offset.ticksToTime(1, 3).valueOf()).to.be.closeTo(0.5, 0.01);
          tickSignal.dispose();
        });
      });

      it('converts from time to ticks with a setValueAtTime', () => {
        return runOffline(() => {
          const tickSignal = createTickSignal({ value: 1 });
          tickSignal.offset.setValueAtTime(2, 1);
          expect(tickSignal.offset.ticksToTime(1, 0).valueOf()).to.be.closeTo(1, 0.01);
          expect(tickSignal.offset.ticksToTime(1, 1).valueOf()).to.be.closeTo(0.5, 0.01);
          expect(tickSignal.offset.ticksToTime(2, 0).valueOf()).to.be.closeTo(1.5, 0.01);
          expect(tickSignal.offset.ticksToTime(1, 3).valueOf()).to.be.closeTo(0.5, 0.01);
          expect(tickSignal.offset.ticksToTime(1, 0.5).valueOf()).to.be.closeTo(0.75, 0.01);
          tickSignal.dispose();
        });
      });

      it('converts from time to ticks with an exponential ramp', () => {
        return runOffline(() => {
          const tickSignal = createTickSignal({ value: 1 });
          tickSignal.offset.exponentialRampTo(2, 1, 1);
          expect(tickSignal.offset.ticksToTime(1, 0)).to.be.closeTo(1, 0.01);
          expect(tickSignal.offset.ticksToTime(1, 1)).to.be.closeTo(0.75, 0.01);
          expect(tickSignal.offset.ticksToTime(2, 0)).to.be.closeTo(1.75, 0.01);
          expect(tickSignal.offset.ticksToTime(1, 3)).to.be.closeTo(0.5, 0.01);
          tickSignal.dispose();
        });
      });

      it('converts from time to ticks with a setTargetAtTime', () => {
        return runOffline(() => {
          const tickSignal = createTickSignal({ value: 1 });
          tickSignal.offset.setTargetAtTime(2, 1, 1);
          expect(tickSignal.offset.ticksToTime(1, 0).valueOf()).to.be.closeTo(1, 0.01);
          expect(tickSignal.offset.ticksToTime(1, 1).valueOf()).to.be.closeTo(0.79, 0.01);
          expect(tickSignal.offset.ticksToTime(2, 0).valueOf()).to.be.closeTo(1.79, 0.01);
          expect(tickSignal.offset.ticksToTime(1, 3).valueOf()).to.be.closeTo(0.61, 0.01);
          tickSignal.dispose();
        });
      });

      it('converts from ticks to time', () => {
        return runOffline(() => {
          const tickSignal = createTickSignal({ value: 20 });
          expect(tickSignal.offset.timeToTicks(1, 0).valueOf()).to.be.closeTo(20, 0.01);
          expect(tickSignal.offset.timeToTicks(0.5, 0).valueOf()).to.be.closeTo(10, 0.01);
          expect(tickSignal.offset.timeToTicks(0.5, 2).valueOf()).to.be.closeTo(10, 0.01);
          tickSignal.dispose();
        });
      });

      it('converts from ticks to time with a setValueAtTime', () => {
        return runOffline(() => {
          const tickSignal = createTickSignal({ value: 1 });
          tickSignal.offset.setValueAtTime(2, 1);
          expect(tickSignal.offset.timeToTicks(1, 0).valueOf()).to.be.closeTo(1, 0.01);
          expect(tickSignal.offset.timeToTicks(1, 1).valueOf()).to.be.closeTo(2, 0.01);
          expect(tickSignal.offset.timeToTicks(1, 2).valueOf()).to.be.closeTo(2, 0.01);
          expect(tickSignal.offset.timeToTicks(1, 0.5).valueOf()).to.be.closeTo(1.5, 0.01);
          tickSignal.dispose();
        });
      });

      it('converts from ticks to time with a linear ramp', () => {
        return runOffline(() => {
          const tickSignal = createTickSignal({ value: 1 });
          tickSignal.offset.linearRampTo(2, 1, 1);
          expect(tickSignal.offset.timeToTicks(1, 0).valueOf()).to.be.closeTo(1, 0.01);
          expect(tickSignal.offset.timeToTicks(1, 1).valueOf()).to.be.closeTo(1.5, 0.01);
          expect(tickSignal.offset.timeToTicks(1, 2).valueOf()).to.be.closeTo(2, 0.01);
          expect(tickSignal.offset.timeToTicks(1, 0.5).valueOf()).to.be.closeTo(1.12, 0.01);
          tickSignal.dispose();
        });
      });

      it('converts from ticks to time with an exponential ramp', () => {
        return runOffline(() => {
          const tickSignal = createTickSignal({ value: 1 });
          tickSignal.offset.exponentialRampTo(2, 1, 1);
          expect(tickSignal.offset.timeToTicks(1, 0).valueOf()).to.be.closeTo(1, 0.01);
          expect(tickSignal.offset.timeToTicks(1, 1).valueOf()).to.be.closeTo(1.44, 0.01);
          expect(tickSignal.offset.timeToTicks(1, 2).valueOf()).to.be.closeTo(2, 0.01);
          expect(tickSignal.offset.timeToTicks(1, 0.5).valueOf()).to.be.closeTo(1.09, 0.01);
          tickSignal.dispose();
        });
      });

      it('converts from ticks to time with a setTargetAtTime', () => {
        return runOffline(() => {
          const tickSignal = createTickSignal({ value: 1 });
          tickSignal.offset.setTargetAtTime(2, 1, 1);
          expect(tickSignal.offset.timeToTicks(1, 0).valueOf()).to.be.closeTo(1, 0.01);
          expect(tickSignal.offset.timeToTicks(1, 1).valueOf()).to.be.closeTo(1.31, 0.01);
          expect(tickSignal.offset.timeToTicks(1, 2).valueOf()).to.be.closeTo(1.63, 0.01);
          expect(tickSignal.offset.timeToTicks(1, 0.5).valueOf()).to.be.closeTo(1.07, 0.01);
          tickSignal.dispose();
        });
      });
    });
  });
});
