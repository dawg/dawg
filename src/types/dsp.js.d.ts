declare module 'dsp.js' {
  class FFT {
    constructor(fftSize: number, sampleRate: number);
    spectrum: Float64Array;
    forward(segment: number[] | Float32Array): void;
  }
}
