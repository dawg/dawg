import { EffectOptions } from '@/core/filters/effects';

export const EffectDefaults: EffectOptions = {
  'Wah': {
    octaves: 3,
    baseFrequency: 350,
    sensitivity: 0,
  },
  'Reverb': {
    dampening: 3000,
    roomSize: 0.7,
  },
  'Phaser': {
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
  'Chorus': {
    frequency: 1.5,
    delayTime: 3.5,
    depth: 0.7,
  },
  'Tremolo': {
    depth: 0.5,
    frequency: 10,
  },
  'Distortion': {
    depth: 0.4,
  },
};
