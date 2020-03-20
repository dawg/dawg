import { createAnalyser } from '@/lib/audio/analyser';
import { expect } from '@/lib/testing';
import { createConstantSource } from '@/lib/audio/constant-source';

describe('Analyser', () => {
  it('can correctly set the size', () => {
    const anl = createAnalyser({ type: 'fft', size: 512 });
    expect(anl.fftSize.value).to.equal(1024);
    anl.fftSize.value = 2048;
    expect(anl.fftSize.value).to.equal(2048);
    anl.dispose();
  });

  it('can run fft analysis', () => {
    const anl = createAnalyser({ type: 'fft', size: 512 });
    const analysis = anl.getValue();
    expect(analysis.length).to.equal(512);
    analysis.forEach((val) => {
      expect(val < 0).to.eq(true);
    });
    anl.dispose();
  });

  it('can run waveform analysis', (done) => {
    const noise = createConstantSource();
    const anl = createAnalyser({ type: 'waveform', size: 256 });
    noise.connect(anl);
    noise.start();

    setTimeout(() => {
      const analysis = anl.getValue();
      expect(analysis.length).to.equal(256);
      analysis.forEach((val) => {
        expect(val).to.be.within(-1, 1);
      });
      anl.dispose();
      noise.dispose();
      done();
    }, 300);
  });
});
