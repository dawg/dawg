import { expect } from 'chai';
import Tone from 'tone';
import Offline from './offline';

describe('TickSignal', () => {
  it('should work', () => {
    const tickSignal = new Tone.TickSignal(1);
    tickSignal.setValueAtTime(2, 1);
    tickSignal.setValueAtTime(10, 2);
    expect(tickSignal.getDurationOfTicks(2, 1.5)).to.be.closeTo(0.6, 0.01);

    const time = tickSignal.toSeconds(1.5);
    expect(time).to.equal(1.5);
    const currentTick = tickSignal.getTicksAtTime(time);
    expect(currentTick).to.equal(2);
    expect(tickSignal.getTimeOfTick(currentTick + 2)).to.equal(2.1);
    expect(tickSignal.getTimeOfTick(4)).to.equal(2.1);

  });
  it('other', () => {
    return Offline((Transport: any) => {
      Transport.start(0).pause(0.1).stop(0.2);

      expect(Transport.getTicksAtTime(0)).to.be.equal(Math.floor(Transport.PPQ * 0));
      expect(Transport.getTicksAtTime(0.05)).to.be.equal(Math.floor(Transport.PPQ * 0.1));
      expect(Transport.getTicksAtTime(0.1)).to.be.equal(Math.floor(Transport.PPQ * 0.2));
      expect(Transport.getTicksAtTime(0.15)).to.be.equal(Math.floor(Transport.PPQ * 0.2));
      expect(Transport.getTicksAtTime(0.2)).to.be.equal(0);

    }, 0.3);
  });
  it('getDurationOfTicks', () => {
    const tickSignal = new Tone.TickSignal(1);
    tickSignal.setValueAtTime(2, 1);
    tickSignal.setValueAtTime(10, 2);
    expect(tickSignal.getDurationOfTicks(1, 0)).to.be.closeTo(1, 0.01);
    expect(tickSignal.getDurationOfTicks(1, 1)).to.be.closeTo(0.5, 0.01);
    expect(tickSignal.getDurationOfTicks(1, 2)).to.be.closeTo(0.1, 0.01);
    expect(tickSignal.getDurationOfTicks(2, 1.5)).to.be.closeTo(0.6, 0.01);
  });

  context('Transport', () => {
    it('can loop events scheduled on the transport', () => {
      let invocations = 0;
      return Offline((Transport: any) => {
        Transport.schedule(() => {
          invocations++;
        }, 0);
        Transport.setLoopPoints(0, 0.1).start(0);
        Transport.loop = true;
      }, 0.41).then(() => {
        expect(invocations).to.equal(5);
      });
    });
  });

  context('TickSource', () => {
    context('forEachTickBetween', () => {
      it('can start at time = 0', () => {
        const source = new Tone.TickSource(1);
        source.start(0);
        let iterations = 0;
        source.forEachTickBetween(0, 0.1, () => {
          iterations++;
        });
        expect(iterations).to.equal(1);
        source.dispose();
      });

      it('iterates once per tick', () => {
        const source = new Tone.TickSource(1);
        source.start(0.5);
        let iterations = 0;
        source.forEachTickBetween(0, 2, () => {
          iterations++;
        });
        expect(iterations).to.equal(2);
        source.dispose();
      });

      it('passes time and tick into the callback', () => {
        const source = new Tone.TickSource(2);
        source.start(0.5);
        let iterations = 0;
        const times = [0.5, 1.0, 1.5];
        source.forEachTickBetween(0, 2, (time, ticks) => {
          expect(times[ticks]).to.eq(time);
          iterations++;
        });
        expect(iterations).to.equal(3);
        source.dispose();
      });
    });
  });
});
