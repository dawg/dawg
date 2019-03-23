import Tone from 'tone';

export type EffectName = keyof EffectOptions;

export const EffectMap = {
  Wah: Tone.AutoWah,
  Reverb: Tone.Freeverb,
  Phaser: Tone.Phaser,
  'Bit Crusher': Tone.BitCrusher,
  'Ping Pong Delay': Tone.PingPongDelay,
  Compressor: Tone.Compressor,
  EQ3: Tone.EQ3,
  Limiter: Tone.Phaser,
  Chorus: Tone.Chorus,
  Tremolo: Tone.Tremolo,
  Distortion: Tone.Distortion,
};

interface PhaserOptions {
  frequency: number;
  octaves: number;
  baseFrequency: number;
  Q: number;
}

interface ReverbOptions {
  decay: number;
  preDelay: number;
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

interface CompressorOptions {
  ratio: number;
  threshold: number;
  release: number;
  attack: number;
  knee: number;
}

interface EQ3Options {
  low: number;
  mid: number;
  high: number;
  lowFrequency: number;
  highFrequency: number;
}

interface LimiterOptions {
  threshold: number;
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
  Wah: Tone.AutoWah;
  Reverb: Tone.Freeverb;
  Phaser: Tone.Phaser;
  'Bit Crusher': Tone.BitCrusher;
  'Ping Pong Delay': Tone.PingPongDelay;
  Compressor: Tone.Compressor;
  EQ3: Tone.EQ3;
  Limiter: Tone.Limiter;
  Chorus: Tone.Chorus;
  Tremolo: Tone.Tremolo;
  Distortion: Tone.Distortion;
}

export interface EffectOptions {
  Wah: WahOptions;
  Reverb: ReverbOptions;
  Phaser: PhaserOptions;
  'Bit Crusher': BitCrusherOptions;
  'Ping Pong Delay': PingPongDelayOptions;
  Compressor: CompressorOptions;
  EQ3: EQ3Options;
  Limiter: LimiterOptions;
  Chorus: ChorusOptions;
  Tremolo: TremoloOptions;
  Distortion: DistortionOptions;
}
