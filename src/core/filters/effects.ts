import Tone from 'tone';

export type EffectName = keyof EffectOptions;

export const EffectMap = {
  wah: Tone.AutoWah,
  reverb: Tone.Freeverb,
  phaser: Tone.Phaser,
  bitCrusher: Tone.BitCrusher,
  pingPongDelay: Tone.PingPongDelay,
  compressor: Tone.Compressor,
  EQ3: Tone.EQ3,
  limiter: Tone.Phaser,
  chorus: Tone.Chorus,
  tremolo: Tone.Tremolo,
  distortion: Tone.Distortion,
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
  wah: Tone.AutoWah;
  reverb: Tone.Freeverb;
  phaser: Tone.Phaser;
  bitCrusher: Tone.BitCrusher;
  pingPongDelay: Tone.PingPongDelay;
  compressor: Tone.Compressor;
  EQ3: Tone.EQ3;
  limiter: Tone.Limiter;
  chorus: Tone.Chorus;
  tremolo: Tone.Tremolo;
  distortion: Tone.Distortion;
}

export interface EffectOptions {
  wah: WahOptions;
  reverb: ReverbOptions;
  phaser: PhaserOptions;
  bitCrusher: BitCrusherOptions;
  pingPongDelay: PingPongDelayOptions;
  compressor: CompressorOptions;
  EQ3: EQ3Options;
  limiter: LimiterOptions;
  chorus: ChorusOptions;
  tremolo: TremoloOptions;
  distortion: DistortionOptions;
}
