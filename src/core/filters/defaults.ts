import { EffectOptions } from '@/core/filters/effects';

export const EffectDefaults: EffectOptions = {
  Wah: {
    octaves: 3,
    baseFrequency: 350,
    sensitivity: 0,
  },
  Reverb: {
    decay: 1.5,
    preDelay: 0.01,
  },
  Phaser: {
    frequency: 0.5,
    octaves: 3,
    Q: 10,
    baseFrequency: 350,
  },
  'Bit Crusher': {
    bits: 4,
  },
  'Ping Pong Delay': {
    delayTime: 0.25,
    feedback: 1,
  },
  Compressor: {
    ratio: 1,
    threshold: -2,
    release: 0.2,
    attack: 0.00,
    knee: 30,
  },
  EQ3: {
    low: 0,
    mid: 0,
    high: 0,
    lowFrequency: 400,
    highFrequency: 2500,
  },
  Limiter: {
    threshold: -12,
  },
  Chorus: {
    frequency: 1.5,
    delayTime: 3.5,
    depth: 0.7,
  },
  Tremolo: {
    depth: 0.5,
    frequency: 10,
  },
  Distortion: {
    depth: 0.4,
  },
};
