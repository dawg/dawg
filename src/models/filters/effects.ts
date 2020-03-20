import * as Audio from '@/lib/audio';

export type EffectName = keyof EffectOptions;

interface PhaserOptions {
  frequency: number;
  octaves: number;
  baseFrequency: number;
  Q: number;
}

interface ReverbOptions {
  dampening: number;
  roomSize: number;
}

interface WahOptions {
  baseFrequency: number;
  sensitivity: number;
  octaves: number;
}

interface BitCrusherOptions {
  bits: number;
}

interface PingPongDelayOptions {
  delayTime: number;
  feedback: number;
}

interface ChorusOptions {
  frequency: number;
  delayTime: number;
  depth: number;
}

interface TremoloOptions {
  frequency: number;
  depth: number;
}

interface DistortionOptions {
  depth: number;
}

export interface EffectTones {
  // Wah: Audio.AutoWah;
  // Reverb: Audio.ObeoFreeverb;
  // Phaser: Audio.Phaser;
  // 'Bit Crusher': Audio.BitCrusher;
  // 'Ping Pong Delay': Audio.PingPongDelay;
  // Chorus: Audio.Chorus;
  // Tremolo: Audio.Tremolo;
  Distortion: Audio.ObeoDistortion;
}

export interface EffectOptions {
  // Wah: WahOptions;
  // Reverb: ReverbOptions;
  // Phaser: PhaserOptions;
  // 'Bit Crusher': BitCrusherOptions;
  // 'Ping Pong Delay': PingPongDelayOptions;
  // Chorus: ChorusOptions;
  // Tremolo: TremoloOptions;
  Distortion: DistortionOptions;
}
