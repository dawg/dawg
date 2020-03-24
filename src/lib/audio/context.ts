import { Ticks, Beat, Seconds, ContextTime } from '@/lib/audio/types';
import { Disposer } from '@/lib/std';
import { Prim, getter, Getter, prim } from '@/lib/reactor';

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

export interface ObeoBaseContext<T extends BaseAudioContext = BaseAudioContext> extends ObeoExtractedBaseContext {
  readonly PPQ: Prim<number>;
  readonly lookAhead: Prim<number>;
  readonly BPM: Prim<number>;
  readonly sampleTime: number;
  readonly raw: T;

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
  secondsToBeats(seconds: Seconds): Beat;
  now(): ContextTime;
  ticksToSeconds(ticks: Ticks): Seconds;
  secondsToTicks(ticks: Seconds): Ticks;
  onDidTick(cb: () => void): Disposer;
}

export interface BaseAudioContextCommon {
  resume(): Promise<void>;
}

export const enhanceBaseContext = <T extends BaseAudioContext & BaseAudioContextCommon>(
  context: T,
  onDidTick: (cb: () => void) => Disposer,
): ObeoBaseContext<T> => {
  const baseContext = extractBaseAudioContext(context);

  const PPQ = prim(192);
  const BPM = prim(120);
  const lookAhead = prim(0.1);

  const beatsToTicks = (beat: Beat): Ticks => {
    return Math.round(beat * PPQ.value);
  };

  const ticksToSeconds = (ticks: Ticks): Seconds => {
    return (ticks / PPQ.value) / BPM.value * 60;
  };

  const secondsToBeats = (seconds: Seconds): Beat => {
    return seconds / 60 * BPM.value;
  };

  const secondsToTicks = (seconds: Seconds): Ticks => {
    return beatsToTicks(secondsToBeats(seconds));
  };

  const beatsToSeconds = (beat: Beat): Seconds => {
    return beat / BPM.value * 60;
  };

  return {
    ...baseContext,
    raw: context,

    PPQ,
    lookAhead,
    BPM,
    sampleTime: 1 / baseContext.sampleRate,
    blockTime: 128 / context.sampleRate,

    round: (beats: Beat) => {
      return Math.round(beats * PPQ.value) / PPQ.value;
    },
    beatsToTicks,
    ticksToSeconds,
    secondsToBeats,
    secondsToTicks,
    beatsToSeconds,
    now: (): ContextTime => {
      return baseContext.currentTime.value + lookAhead.value;
    },
    onDidTick,
  };
};
