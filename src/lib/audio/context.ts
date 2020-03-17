import { Ticks, Beat, Seconds, ContextTime } from '@/lib/audio/types';
import { defineProperties } from '@/lib/std';
import { emitter } from '@/lib/events';
import { Derived, Prim, getter, Getter, prim } from '@/lib/reactor';

export const extractBaseAudioContext = (
  context: BaseAudioContext & BaseAudioContextCommon,
): ObeoExtractedBaseContext => {
  return {
    currentTime: getter(() => context.currentTime),
    destination: context.destination,
    sampleRate: context.sampleRate,
    state: getter(() => context.state),

    createAnalyser: context.createAnalyser.bind(context),
    createBiquadFilter: context.createBiquadFilter.bind(context),
    createBuffer: context.createBuffer.bind(context),
    createBufferSource: context.createBufferSource.bind(context),
    createChannelMerger: context.createChannelMerger.bind(context),
    createChannelSplitter: context.createChannelSplitter.bind(context),
    createConstantSource: context.createConstantSource.bind(context),
    createConvolver: context.createConvolver.bind(context),
    createDelay: context.createDelay.bind(context),
    createDynamicsCompressor: context.createDynamicsCompressor.bind(context),
    createGain: context.createGain.bind(context),
    createIIRFilter: context.createIIRFilter.bind(context),
    createOscillator: context.createOscillator.bind(context),
    createPanner: context.createPanner.bind(context),
    createStereoPanner: context.createStereoPanner.bind(context),
    createWaveShaper: context.createWaveShaper.bind(context),
    decodeAudioData: context.decodeAudioData.bind(context),

    resume: context.resume.bind(context),
  };
};

export interface ObeoExtractedBaseContext {
  readonly destination: AudioDestinationNode;
  readonly currentTime: Getter<number>;
  readonly sampleRate: number;
  readonly state: Getter<AudioContextState>;
  // resume(): Promise<void>;
  createAnalyser(): AnalyserNode;
  createBiquadFilter(): BiquadFilterNode;
  createBuffer(numberOfChannels: number, length: number, sampleRate: number): AudioBuffer;
  createBufferSource(): AudioBufferSourceNode;
  createChannelMerger(numberOfInputs?: number): ChannelMergerNode;
  createChannelSplitter(numberOfOutputs?: number): ChannelSplitterNode;
  createConstantSource(): ConstantSourceNode;
  createConvolver(): ConvolverNode;
  createDelay(maxDelayTime?: number): DelayNode;
  createDynamicsCompressor(): DynamicsCompressorNode;
  createGain(): GainNode;
  createIIRFilter(feedforward: number[], feedback: number[]): IIRFilterNode;
  createOscillator(): OscillatorNode;
  createPanner(): PannerNode;
  createStereoPanner(): StereoPannerNode;
  createWaveShaper(): WaveShaperNode;
  decodeAudioData(
    audioData: ArrayBuffer,
    successCallback?: DecodeSuccessCallback | null,
    errorCallback?: DecodeErrorCallback | null,
  ): Promise<AudioBuffer>;
  resume(): Promise<void>;
}

export interface ObeoBaseContext extends ObeoExtractedBaseContext {
  readonly PPQ: Prim<number>;
  readonly lookAhead: Prim<number>;
  readonly BPM: Prim<number>;
  readonly sampleTime: number;

  /**
   * The number of seconds of 1 processing block (128 samples)
   */
  readonly blockTime: number;

  /**
   * Rounds the given beat to the nearest pulse increment.
   * @param beats The beats to convert.
   */
  round(beats: Beat): Beat;
  beatsToTicks(beat: Beat): Ticks;
  beatsToSeconds(beat: Beat): Seconds;
  now(): ContextTime;
  ticksToSeconds(ticks: Ticks): Seconds;
}

export interface BaseAudioContextCommon {
  resume(): Promise<void>;
}

export const enhanceBaseContext = (context: BaseAudioContext & BaseAudioContextCommon): ObeoBaseContext => {
  const baseContext = extractBaseAudioContext(context);

  const PPQ = prim(192);
  const BPM = prim(120);
  const lookAhead = prim(120);

  return {
    ...baseContext,

    PPQ,
    lookAhead,
    BPM,
    sampleTime: 1 / baseContext.sampleRate,
    blockTime: 128 / context.sampleRate,

    round: (beats: Beat) => {
      return Math.round(beats * PPQ.value) / PPQ.value;
    },
    beatsToTicks: (beat: Beat): Ticks => {
      return Math.round(beat * PPQ.value);
    },
    ticksToSeconds(ticks: Ticks): Seconds {
      return (ticks / PPQ.value) / BPM.value * 60;
    },
    beatsToSeconds: (beat: Beat): Seconds => {
      return beat / BPM.value * 60;
    },
    now: (): ContextTime => {
      return baseContext.currentTime.value + lookAhead.value;
    },
  };
};
