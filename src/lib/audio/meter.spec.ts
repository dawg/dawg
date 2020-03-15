import { createMeter } from '@/lib/audio/meter';
import { expect } from '@/lib/testing';
import { createOscillator } from '@/lib/audio/oscillator';

describe.only('ObeoMeter', () => {
  it('can be constructed with the smoothing', () => {
    const meter = createMeter({ smoothing: 0.5 });
    expect(meter.smoothing).to.equal(0.5);
    meter.dispose();
  });

  it('can be constructed with an object', () => {
    const meter = createMeter({
      smoothing: 0.3,
    });
    expect(meter.smoothing).to.equal(0.3);
    meter.dispose();
  });

  it.skip('can get the rms level of the incoming signal', (done) => {
    const meter = createMeter();
    const osc = createOscillator();
    osc.connect(meter);
    osc.start();
    osc.volume.value = -6;
    setTimeout(() => {
      expect(meter.getValue()).to.be.closeTo(-9, 1);
      meter.dispose();
      osc.dispose();
      done();
    }, 400);
  });

  it.skip('can get the values in normal range', (done) => {
    const meter = createMeter({
      normalRange: true,
    });
    const osc = createOscillator();
    osc.connect(meter);
    osc.start();

    osc.volume.value = -6;
    setTimeout(() => {
      expect(meter.getValue()).to.be.closeTo(0.35, 0.15);
      meter.dispose();
      osc.dispose();
      done();
    }, 400);
  });
});
