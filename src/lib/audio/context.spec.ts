import { enhanceBaseContext } from '@/lib/audio/context';
import { expect } from '@/lib/testing';

describe('context', () => {
  const create = () => {
    const context = enhanceBaseContext(
      new OfflineAudioContext({ sampleRate: 4000, length: 4000 }),
      () => ({ dispose: () => ({}) }),
    );
    context.BPM.value = 100;
    context.PPQ.value = 200;
    return context;
  };

  it('constructs correctly', () => {
    create();
  });

  it('correctly converts beatsToSeconds', () => {
    const c = create();
    // beats / BPM * 60
    expect(c.beatsToSeconds(1)).to.be.closeTo(1 / 100 * 60, 0.001);
  });

  it('correctly converts ticksToSeconds', () => {
    const c = create();
    // ticks / PPQ / BPM * 60
    expect(c.ticksToSeconds(100)).to.be.closeTo(100 / 200 / 100 * 60, 0.001);
  });

  it('correctly converts beatsToTicks', () => {
    const c = create();
    // ticks / PPQ / BPM * 60
    expect(c.beatsToTicks(2)).to.be.closeTo(2 * 200, 0.001);
  });

  it('correctly rounds the beats to the nearest pulse', () => {
    const c = create();
    const value = 2 / 200 + 0.000023243543643;
    expect(c.round(value)).to.eq(2 / 200);
  });
});
