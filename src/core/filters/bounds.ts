import { EffectOptions } from './effects';

interface Constraints {
  min: number;
  max: number;
}

export type EffectConstrainsType = { [K in keyof EffectOptions]: { [E in keyof EffectOptions[K]]: Constraints } };

export const EffectConstrains: EffectConstrainsType = {
  'Wah': {
    baseFrequency: {
      min: 0,
      max: 1000,
    },
    octaves: {
      min: 0,
      max: 10,
    },
    sensitivity: {
      min: -40,
      max: 0,
    },
  },
  'Reverb': {
    decay: {
      min: 0,
      max: 24,
    },
    preDelay: {
      min: 0,
      max: 24,
    },
  },
  'Phaser': {
    frequency: {
      min: 0,
      max: 10,
    },
    octaves: {
      min: 0,
      max: 10,
    },
    Q: {
      min: 0,
      max: 100,
    },
    baseFrequency: {
      min: 0,
      max: 1000,
    },
  },
  'Bit Crusher': {
    bits: {
      min: 0,
      max: 10,
    },
  },
  'Ping Pong Delay': {
    delayTime: {
      min: 0,
      max: 10,
    },
    feedback: {
      min: 0,
      max: 0,
    },
  },
  'Compressor': {
    ratio: {
      min: 0,
      max: 20,
    },
    threshold: {
      min: -40,
      max: 0,
    },
    release: {
      min: 0,
      max: 1,
    },
    attack: {
      min: 0,
      max: 1,
    },
    knee: {
      min: 0,
      max: 50,
    },
  },
  'EQ3': {
    low: {
      min: -10,
      max: 10,
    },
    mid: {
      min: -10,
      max: 10,
    },
    high: {
      min: -10,
      max: 10,
    },
    lowFrequency: {
      min: 200,
      max: 1000,
    },
    highFrequency: {
      min: 2000,
      max: 8000,
    },
  },
  'Limiter': {
    threshold: {
      min: -10,
      max: 2,
    },
  },
  'Chorus': {
    frequency: {
      min: 0,
      max: 0,
    },
    delayTime: {
      min: 0,
      max: 0,
    },
    depth: {
      min: 0,
      max: 0,
    },
  },
  'Tremolo': {
    frequency: {
      min: 0,
      max: 20,
    },
    depth: {
      min: 0,
      max: 1,
    },
  },
  'Distortion': {
    depth: {
      min: 0,
      max: 1,
    },
  },
};
