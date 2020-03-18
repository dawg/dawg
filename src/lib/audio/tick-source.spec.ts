import { expect } from '@/lib/testing';
import { runOffline } from '@/lib/audio/offline';
import { createTickSource } from '@/lib/audio/tick-source';

describe('ObeoTickSource', () => {
  it('can pass in the frequency', () => {
    const source = createTickSource({ frequency: 2 });
    expect(source.frequency.offset.value).to.equal(2);
    source.dispose();
  });

  it('initially returns stop', () => {
    const source = createTickSource({ frequency: 2 });
    expect(source.getStateAtTime(0)).to.equal('stopped');
    source.dispose();
  });

  context('Ticks', () => {

    it('ticks are 0 before started', () => {
      const source = createTickSource();
      expect(source.getTicksAtTime(0)).to.equal(0);
      source.dispose();
    });

    it('can set ticks', () => {
      const source = createTickSource();
      expect(source.getTicksAtTime()).to.equal(0);
      source.setTicksAtTime(10);
      expect(source.getTicksAtTime()).to.equal(10);
      source.dispose();
    });

    it('ticks increment at the rate of the frequency after started', async () => {
      await runOffline((offline) => {
        const source = createTickSource();
        source.start(0);
        offline.onDidTick(() => {
          expect(source.ticks.value).to.be.closeTo(offline.now(), 0.1);
        });
      }, { duration: 0.5 });
    });

    it('ticks return to 0 after stopped', () => {
      return runOffline((offline) => {
        const source = createTickSource({ frequency: 2 });
        source.start(0);
        source.stop(0.4);
        offline.onDidTick(() => {
          if (offline.now() < 0.399) {
            expect(source.ticks.value).to.be.closeTo(2 * offline.now(), 0.01);
          } else if (offline.now() > 0.4) {
            expect(source.ticks.value).to.be.equal(0);
          }
        });
      }, { duration: 0.5 });
    });

    it('returns the paused ticks when paused', () => {
      return runOffline((offline) => {
        const source = createTickSource({ frequency: 2 });
        source.start(0);
        source.pause(0.4);
        let pausedTicks = -1;
        offline.onDidTick(() => {
          if (offline.now() < 0.4) {
            pausedTicks = source.ticks.value;
            expect(source.ticks.value).to.be.closeTo(2 * offline.now(), 0.01);
          } else {
            expect(source.ticks.value).to.be.closeTo(pausedTicks, 0.01);
          }
        });
      }, { duration: 0.5 });
    });

    it('ticks restart at 0 when started after stop', () => {
      const source = createTickSource({ frequency: 3 });
      source.start(0).stop(1).start(2);
      expect(source.getTicksAtTime(0)).to.be.closeTo(0, 0.01);
      expect(source.getTicksAtTime(0.5)).to.be.closeTo(1.5, 0.01);
      expect(source.getTicksAtTime(1)).to.be.closeTo(0, 0.01);
      expect(source.getTicksAtTime(2)).to.be.closeTo(0, 0.01);
      expect(source.getTicksAtTime(3)).to.be.closeTo(3, 0.01);
      source.dispose();
    });

    it('ticks remain the same after paused', () => {
      const source = createTickSource({ frequency: 3 });
      source.start(0).pause(1);
      expect(source.getTicksAtTime(0)).to.be.closeTo(0, 0.01);
      expect(source.getTicksAtTime(0.5)).to.be.closeTo(1.5, 0.01);
      expect(source.getTicksAtTime(1)).to.be.closeTo(3, 0.01);
      expect(source.getTicksAtTime(2)).to.be.closeTo(3, 0.01);
      expect(source.getTicksAtTime(3)).to.be.closeTo(3, 0.01);
      source.dispose();
    });

    it('ticks resume where they were paused', () => {
      const source = createTickSource({ frequency: 2 });
      source.start(0).pause(1).start(2);
      expect(source.getTicksAtTime(0)).to.be.closeTo(0, 0.01);
      expect(source.getTicksAtTime(0.5)).to.be.closeTo(1, 0.01);
      expect(source.getTicksAtTime(1)).to.be.closeTo(2, 0.01);
      expect(source.getTicksAtTime(2)).to.be.closeTo(2, 0.01);
      expect(source.getTicksAtTime(3)).to.be.closeTo(4, 0.01);
      expect(source.getTicksAtTime(4)).to.be.closeTo(6, 0.01);
      source.dispose();
    });

    it('ticks return to 0 after pause then stopped', () => {
      const source = createTickSource({ frequency: 2 });
      source.start(0).pause(1).start(2).stop(3);
      expect(source.getTicksAtTime(0)).to.be.closeTo(0, 0.01);
      expect(source.getTicksAtTime(0.5)).to.be.closeTo(1, 0.01);
      expect(source.getTicksAtTime(1)).to.be.closeTo(2, 0.01);
      expect(source.getTicksAtTime(2)).to.be.closeTo(2, 0.01);
      expect(source.getTicksAtTime(3)).to.be.closeTo(0, 0.01);
      expect(source.getTicksAtTime(4)).to.be.closeTo(0, 0.01);
      source.dispose();
    });

    it('handles multiple starts/stops', () => {
      const source = createTickSource({ frequency: 1 });
      source.start(0).stop(0.3).start(0.4).stop(0.5).start(0.6);
      expect(source.getTicksAtTime(0)).to.be.closeTo(0, 0.01);
      expect(source.getTicksAtTime(0.1)).to.be.closeTo(0.1, 0.01);
      expect(source.getTicksAtTime(0.2)).to.be.closeTo(0.2, 0.01);
      expect(source.getTicksAtTime(0.3)).to.be.closeTo(0, 0.01);
      expect(source.getTicksAtTime(0.4)).to.be.closeTo(0, 0.01);
      expect(source.getTicksAtTime(0.5)).to.be.closeTo(0, 0.01);
      expect(source.getTicksAtTime(0.6)).to.be.closeTo(0, 0.01);
      expect(source.getTicksAtTime(0.7)).to.be.closeTo(0.1, 0.01);
      expect(source.getTicksAtTime(0.8)).to.be.closeTo(0.2, 0.01);
      source.dispose();
    });

    // it('can get ticks when started with an offset', () => {
    //   const source = createTickSource({ frequency: 1 });
    //   source.start(0, 2).stop(3).start(5, 1);
    //   expect(source.getTicksAtTime(0)).to.be.closeTo(2, 0.01);
    //   expect(source.getTicksAtTime(1)).to.be.closeTo(3, 0.01);
    //   expect(source.getTicksAtTime(2)).to.be.closeTo(4, 0.01);
    //   expect(source.getTicksAtTime(3)).to.be.closeTo(0, 0.01);
    //   expect(source.getTicksAtTime(4)).to.be.closeTo(0, 0.01);
    //   expect(source.getTicksAtTime(5)).to.be.closeTo(1, 0.01);
    //   expect(source.getTicksAtTime(6)).to.be.closeTo(2, 0.01);
    //   source.dispose();
    // });

    it('can invoke stop multiple times, takes the last invokation', () => {
      const source = createTickSource({ frequency: 1 });
      source.start(0).stop(3).stop(2).stop(4);
      expect(source.getTicksAtTime(0)).to.be.closeTo(0, 0.01);
      expect(source.getTicksAtTime(1)).to.be.closeTo(1, 0.01);
      expect(source.getTicksAtTime(2)).to.be.closeTo(2, 0.01);
      expect(source.getTicksAtTime(3)).to.be.closeTo(3, 0.01);
      expect(source.getTicksAtTime(4)).to.be.closeTo(0, 0.01);
      expect(source.getTicksAtTime(5)).to.be.closeTo(0, 0.01);
      expect(source.getTicksAtTime(6)).to.be.closeTo(0, 0.01);
      source.dispose();
    });

    it('can set multiple setTicksAtTime', () => {
      const source = createTickSource({ frequency: 1 });
      source.start(0).pause(3);
      source.setTicksAtTime(1, 0);
      source.setTicksAtTime(1, 4);
      source.stop(5).start(6);
      source.setTicksAtTime(2, 7);
      expect(source.getTicksAtTime(0)).to.be.closeTo(1, 0.01);
      expect(source.getTicksAtTime(1)).to.be.closeTo(2, 0.01);
      expect(source.getTicksAtTime(2)).to.be.closeTo(3, 0.01);
      expect(source.getTicksAtTime(3)).to.be.closeTo(4, 0.01);
      expect(source.getTicksAtTime(3.5)).to.be.closeTo(4, 0.01);
      expect(source.getTicksAtTime(4)).to.be.closeTo(1, 0.01);
      expect(source.getTicksAtTime(5)).to.be.closeTo(0, 0.01);
      expect(source.getTicksAtTime(6)).to.be.closeTo(0, 0.01);
      expect(source.getTicksAtTime(6.5)).to.be.closeTo(0.5, 0.01);
      expect(source.getTicksAtTime(7)).to.be.closeTo(2, 0.01);
      source.dispose();
    });

    // it('can pass start offset', () => {
    //   const source = createTickSource({ frequency: 2 });
    //   source.start(0, 2).pause(1).start(2, 1);
    //   expect(source.getTicksAtTime(0)).to.be.closeTo(2, 0.01);
    //   expect(source.getTicksAtTime(1)).to.be.closeTo(4, 0.01);
    //   expect(source.getTicksAtTime(2)).to.be.closeTo(1, 0.01);
    //   expect(source.getTicksAtTime(3)).to.be.closeTo(3, 0.01);
    //   expect(source.getTicksAtTime(4)).to.be.closeTo(5, 0.01);
    //   source.dispose();
    // });

    it('can set ticks at any point', () => {
      const source = createTickSource({ frequency: 2 });
      source.start(0).pause(1).start(2);
      source.setTicksAtTime(2, 0);
      source.setTicksAtTime(10, 1.5);
      source.setTicksAtTime(2, 3.5);
      expect(source.getTicksAtTime(0)).to.be.closeTo(2, 0.01);
      expect(source.getTicksAtTime(1)).to.be.closeTo(4, 0.01);
      expect(source.getTicksAtTime(2)).to.be.closeTo(10, 0.01);
      expect(source.getTicksAtTime(3)).to.be.closeTo(12, 0.01);
      expect(source.getTicksAtTime(4)).to.be.closeTo(3, 0.01);
      expect(source.getTicksAtTime(5)).to.be.closeTo(5, 0.01);
      source.dispose();
    });

    it('get the time of the ticks', () => {
      const source = createTickSource({ frequency: 2 });
      source.start(0).pause(1).start(2);
      source.setTicksAtTime(2, 0);
      source.setTicksAtTime(10, 1.5);
      source.setTicksAtTime(2, 3.5);
      expect(source.getTimeOfTick(2, 0.9)).to.be.closeTo(0, 0.01);
      expect(source.getTimeOfTick(4, 0.9)).to.be.closeTo(1, 0.01);
      expect(source.getTimeOfTick(10, 3)).to.be.closeTo(2, 0.01);
      expect(source.getTimeOfTick(12, 3)).to.be.closeTo(3, 0.01);
      expect(source.getTimeOfTick(3, 4)).to.be.closeTo(4, 0.01);
      expect(source.getTimeOfTick(5, 4)).to.be.closeTo(5, 0.01);
      source.dispose();
    });

    it('can cancel scheduled events', () => {
      const source = createTickSource({ frequency: 1 });
      source.start(0).stop(3);
      source.setTicksAtTime(10, 2);
      source.cancel(1);
      expect(source.getTicksAtTime(0)).to.be.closeTo(0, 0.01);
      expect(source.getTicksAtTime(1)).to.be.closeTo(1, 0.01);
      expect(source.getTicksAtTime(2)).to.be.closeTo(2, 0.01);
      expect(source.getTicksAtTime(3)).to.be.closeTo(3, 0.01);
      expect(source.getTicksAtTime(4)).to.be.closeTo(4, 0.01);
      expect(source.getTicksAtTime(5)).to.be.closeTo(5, 0.01);
      expect(source.getTicksAtTime(6)).to.be.closeTo(6, 0.01);
      source.dispose();
    });
  });
});
