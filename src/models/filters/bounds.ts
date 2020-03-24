import { EffectOptions } from '@/models/filters/effects';

interface Constraints {
  min: number;
  max: number;
}

export type EffectConstrainsType = {
  [K in keyof EffectOptions]: { [E in keyof EffectOptions[K]]: Constraints }
};

export const EffectConstrains: EffectConstrainsType = {
  // 'Wah': {
  //   baseFrequency: {
  //     min: 0,
  //     max: 1000,
  //   },
  //   octaves: {
  //     min: 0,
  //     max: 10,
  //   },
  //   sensitivity: {
  //     min: -40,
  //     max: 0,
  //   },
  // },
  // Reverb: {
  //   dampening: {
  //     min: 0,
  //     max: 5000,
  //   },
  //   roomSize: {
  //     min: 0,
  //     max: 1,
  //   },
  // },
  // 'Phaser': {
  //   frequency: {
  //     min: 0,
  //     max: 10,
  //   },
  //   octaves: {
  //     min: 0,
  //     max: 10,
  //   },
  //   Q: {
  //     min: 0,
  //     max: 100,
  //   },
  //   baseFrequency: {
  //     min: 0,
  //     max: 1000,
  //   },
  // },
  // 'Bit Crusher': {
  //   bits: {
  //     min: 0,
  //     max: 10,
  //   },
  // },
  // 'Ping Pong Delay': {
  //   delayTime: {
  //     min: 0,
  //     max: 10,
  //   },
  //   feedback: {
  //     min: 0,
  //     max: 0,
  //   },
  // },
  // 'Chorus': {
  //   frequency: {
  //     min: 0,
  //     max: 0,
  //   },
  //   delayTime: {
  //     min: 0,
  //     max: 0,
  //   },
  //   depth: {
  //     min: 0,
  //     max: 0,
  //   },
  // },
  // 'Tremolo': {
  //   frequency: {
  //     min: 0,
  //     max: 20,
  //   },
  //   depth: {
  //     min: 0,
  //     max: 1,
  //   },
  // },
  Distortion: {
    depth: {
      min: 0,
      max: 1,
    },
  },
};
