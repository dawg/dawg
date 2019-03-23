import { EffectOptions } from '@/core/filters/effect';

export const EffectDefaults: EffectOptions = {
  wah: {
    octaves: 3,
    baseFrequency: 350,
    sensitivity: 0,
  },
  reverb: {
    decay: 1.5,
    preDelay: 0.01,
  },
  phaser: {
    frequency: 0.5,
    octaves: 3,
    Q: 10,
    baseFrequency: 350,
  },
  bitCrusher: {
    bits: 4,
  },
  pingPongDelay: {
    delayTime: 0.25,
    feedback: 1,
  },
  compressor: {
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
  limiter: {
    threshold: -12,
  },
  chorus: {
    frequency: 1.5,
    delayTime: 3.5,
    depth: 0.7,
  },
  tremolo: {
    depth: 0.5,
    frequency: 10,
  },
  distortion: {
    depth: 0.4,
  },
};
