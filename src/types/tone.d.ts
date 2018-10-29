// Type definitions for TONE.JS
// Project: https://github.com/Tonejs/js
// Definitions by: Luke Phillips <https://github.com/lukephills>
//                 Pouya Kary <https://github.com/pmkary>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

//var tone: {
//    new(inputs?: number, outputs?: number): Tone;
//}

declare module 'tone' {
  class Tone {
    constructor(inputs?: number, outputs?: number);
    context: AudioContext;
    input: GainNode;
    output: GainNode;
    chain(...nodes: any[]): Tone;
    connectSeries(...args: any[]): Tone;
    connectParallel(...args: any[]): Tone;
    dbToGain(db: number): number;
    defaultArg(given: any, fallback: any): any;
    dispose(): this;
    equalPowerScale(percent:number): number;
    expScale(gain: number): number;
    extend(child: ()=>any, parent?: ()=>any): void;
    frequencyToNote(freq:number):string;
    frequencyToSeconds(freq:number):number;
    gainToDb(gain: number): number;
    get(params?:any): any;
    interpolate(input: number, outputMin: number, outputMax: number): number;
    isFrequency(freq: number): boolean;
    isFunction(arg: any): boolean;
    isUndef(arg: any): boolean;
    midiToNote(midiNumber: number): string;
    noGC(): Tone;
    normalize(input: number, inputMin: number, inputMax: number): number;
    notationToSeconds(notation: string, bpm?: number, timeSignature?: number): number;
    noteToFrequency(note: string): number;
    noteToMidi(note: string): number;
    now(): number;
    optionsObject(values: Array<any>, keys: Array<string>, defaults?:Object): Object;
    receive(channelName: string, input?: AudioNode): Tone;
    samplesToSeconds(samples: number): number;
    secondsToFrequency(seconds: number): number;
    send(channelName: string, amount?: number): Tone;
    setContext(ctx: AudioContext): void;
    setPreset(presetName: string): Tone;
    startMobile(): void;
    toFrequency(note: Frequency, now?: number): number;
    toMaster(): this;
    toSamples(time: Time): number;
    toSeconds(time?: number, now?: number): number;
  }

  class Abs extends SignalBase {
      dispose(): this;
  }

  class Add extends Signal {
      constructor(value?:number);
      dispose(): this;
  }

  class AmplitudeEnvelope extends Envelope {
      constructor(attack?: any, decay?: Time, sustain?: number, release?:Time); //TODO: Change 'any' to 'Time | Object'
      dispose(): this;
  }

  class AMSynth extends Monophonic {
      constructor(options?: Object);
      carrier: MonoSynth;
      frequency: Signal;
      harmonicity: number;
      modulator: MonoSynth;
      dispose(): this;
      triggerEnvelopeAttack(time?: Time, velocity?: number): AMSynth;
      triggerEnvelopeRelease(time?: Time): AMSynth;
  }

  class AND extends SignalBase {
      constructor(inputCount?:number);
      dispose(): this;
  }

  class AudioToGain extends SignalBase {
      constructor();
      dispose(): this;
  }

  class AudioNode extends Tone {
    disconnect(output: number | AudioNode): this;
    connect(unit: Tone | AudioParam | AudioNode, outputNum?:number, inputNum?:number): this;
  }

  class AutoPanner extends Effect {
      constructor(frequency?: any); //TODO: Number || Object
      amount: Signal;
      frequency: Signal;
      type: string;
      dispose(): this;
      start(Time?: Time): AutoPanner;
      stop(Time?: Time): AutoPanner;
      sync(): AutoPanner;
      unsync(): AutoPanner;
  }

  class AutoWah extends Effect {
      constructor(baseFrequency?: any, octaves?: number, sensitivity?:number); //Todo number | Object
      baseFrequency: Frequency;
      gain: Signal;
      octaves: number;
      Q: Signal;
      sensitivity: number;
      dispose(): this;
  }

  class BitCrusher extends Effect {
      constructor(bits: any); //TODO: Number || Object
      bits: number;
      dispose(): this;
  }

  class Buffer extends Tone {
      constructor(url: any); //TODO: Change 'any' to 'AudioBuffer | string' when available
      MAX_SIMULTANEOUS_DOWNLOADS: number;
      duration: number; // Readonly
      loaded: boolean; // Readonly
      onload: (e: any)=>any;
      url: string; // Readonly
      load(url:string, callback?: (e: any)=>any): Buffer;
      onerror(): void;
      onprogress(): void;
      dispose(): this;
      get(): AudioBuffer;
      set(buffer: any): Buffer; //TODO: change any to AudioBuffer | Buffer
  }

  class Chebyshev extends Effect {
      constructor(order: any); //TODO: Number || Object
      order: number;
      oversample: string;
      dispose(): this;
  }

  class Chorus extends StereoXFeedbackEffect {
      constructor(rate?: any, delayTime?: number, depth?: number);
      delayTime: number
      depth: number;
      frequency: Signal;
      type: string;
      dispose(): this;
  }

  class Clip extends SignalBase {
      constructor(min: number, max: number);
      max: Signal;
      min: Signal;
      dispose(): this;
  }

  class Compressor extends Tone {
      constructor(threshold?: any, ratio?: number); //TODO: Number || Object
      attack: Signal;
      knee: AudioParam;
      ratio: AudioParam;
      release: Signal;
      threshold: AudioParam;
      dispose(): this;
  }

  class Convolver extends Effect {
      constructor(url: any); //TODO: Change any to 'string | AudioBuffer' when available
      buffer: AudioBuffer;
      load(url: string, callback?: (e: any)=>any): Convolver;
      dispose(): this;
  }

  class CrossFade extends Tone {
      constructor(initialFade?: number);
      a: GainNode;
      b: GainNode;
      fade: Signal;
      dispose(): this;
  }

  class Distortion extends Effect {
      constructor(distortion: any); //TODO: Number || Object
      distortion: number;
      oversample: string;
      dispose(): this;
  }

  class DuoSynth extends Monophonic {
      constructor(options?: any);
      frequency: Signal;
      harmonicity: number;
      vibratoAmount: Signal;
      vibratoRate: Signal;
      voice0: MonoSynth;
      voice1: MonoSynth;
      triggerEnvelopeAttack(time?: Time, velocity?: number): DuoSynth;
      triggerEnvelopeRelease(time?: Time): DuoSynth;
  }

  class Effect extends Tone {
      constructor(initialWet?: number);
      wet: Signal;
      bypass(): Effect;
      dispose(): this;
  }

  class Envelope extends Tone {
      constructor(attack: any, decay?: Time, sustain?: number, release?: Time);  //TODO: Change 'any' to 'Time | Object'
      attack: Time;
      decay: Time;
      release: Time;
      sustain: number;
      dispose(): this;
      triggerAttack(time?: Time, velocity?: number): Envelope;
      triggerAttackRelease(duration: Time, time?: Time, velocity?: number): Envelope;
      triggerRelease(time?: Time): Envelope;
  }

  class EQ3 extends Tone {
      constructor(lowLevel?: any, midLevel?: number, highLevel?: number); //TODO: Change 'any' to 'number | Object'
      highFrequency: Signal;
      high: GainNode;
      lowFrequency: Signal;
      low: GainNode;
      mid: GainNode;
      dispose(): this;
  }

  class Equal extends SignalBase {
      constructor(value: number);
      value: number;
      dispose(): this;
  }

  class EqualPowerGain extends SignalBase {
      constructor();
      dispose(): this;
  }

  class EqualZero extends SignalBase {
      constructor();
      dispose(): this;
  }

  class Expr extends SignalBase {
      constructor(expr: string);
      input: any; //todo: any[]
      output: any; // todo: tone
      dispose(): this;
  }

  class FeedbackCombFilter extends Tone {
      constructor(minDelay?: number, maxDelay?: number);
      delayTime: Time;
      resonance: Signal;
      dispose(): this;
  }

  class FeedbackDelay extends FeedbackEffect {
      constructor(delayTime: any);
      delayTime: Signal;
      dispose(): this;
  }

  class FeedbackEffect extends Effect {
      constructor(initialFeedback?: any)
      feedback: Signal;
      dispose(): this;
  }

  class Filter extends Tone {
      constructor(freq?: any, type?: string, rolloff?: number); //TODO: Number || Object
      detune: Signal;
      frequency: Signal;
      gain: AudioParam;
      Q: Signal;
      rolloff: number;
      type: string;
      dispose(): this;
  }

  class FMSynth extends Monophonic {
      constructor(options?: any);
      carrier: MonoSynth;
      frequency: Signal;
      harmonicity: number;
      modulationIndex: number;
      modulator: MonoSynth;
      dispose(): this;
      triggerEnvelopeAttack(time?: Time, velocity?: number): FMSynth;
      triggerEnvelopeRelease(time?: Time): FMSynth;
  }

  class Follower extends Tone {
    constructor(attack?: Time, release?: Time);  
    attack: Time;
    release: Time;
    dispose(): this;
  }

  class Freeverb extends Effect {
      constructor(roomSize?: any, dampening?: number);
      dampening: Signal;
      roomSize: Signal;
      dispose(): this;
  }

  class TimeBase {
      set ( exprString: string ): TimeBase;
      add ( val: Time, units?: string ): TimeBase;
      sub ( val: Time, units?: string ): TimeBase;
      mult ( val: Time, units?: string ): TimeBase;
      div ( val: Time, units?: string ): TimeBase;
      eval ( ): number;
      dispose: TimeBase;
  }

  class Frequency extends TimeBase {
      constructor( val: string | number, units?: string );
      toMidi( ): number;
      toNote( ): string;
      transpose ( interval: number ): Frequency;
      harmonize( intervals: number[ ]): Frequency;
      toSeconds( ): number;
      toTicks( ): number;
      midiToFrequency( midi: string ): Frequency;
      frequencyToMidi( frequency: Frequency ): string;
  }

  class Gate extends Tone {
    constructor(thresh?: number, attackTime?: Time, releaseTime?: Time);
    attack: Time;
    release: Time;
    threshold: Time;
    dispose(): this;
  }

  class GreaterThan extends Signal {
      constructor(value?: number);
    dispose(): this;
  }

  class GreaterThanZero extends SignalBase {
    dispose(): this;
  }

  class IfThenElse extends SignalBase {
      dispose(): this;
  }

  class Instrument extends AudioNode {
      volume: Signal;
      triggerAttackRelease(note: any, duration: Time, time?: Time, velocity?: number): Instrument; //Todo: string | number
      dispose(): this;
  }

  class JCReverb extends Effect {
      constructor(roomSize: number); //TODO: Number || Object
      roomSize: Signal;
      dispose(): this;
  }

  class LessThan extends Signal {
    constructor(value?: number);  
    dispose(): this;
  }

  class LFO extends Oscillator {
      constructor(frequency?: Time, outputMin?: number, outputMax?: number); //TODO: Number || Object
      amplitude: Signal;
      frequency: Signal;
      max: number;
      min: number;
      oscillator: Oscillator;
      phase: number;
      type: string;
      dispose(): this;
      start(time?: Time): LFO;
      stop(time?: Time): LFO;
      sync(delay?: Time): LFO;
      unsync(): LFO;
  }

  class Limiter extends Tone {
      constructor(threshold: AudioParam)
      dispose(): this;
  }

  class LowpassCombFilter extends Tone {
      constructor(minDelay?: number, maxDelay?: number)
      dampening: Signal;
      delayTime: Time;
      resonance: Signal;
      dispose(): this;
      setDelayTimeAtTime(delayAmount: Time, time?: Time): LowpassCombFilter;
  }

  var Master: MasterClass;

  class MasterClass extends AudioNode {
      volume: Signal;
      mute(): MasterClass;
      unmute(): MasterClass;
      receive(node:any): MasterClass; //todo: AudioNode | tone
      send(node:any): MasterClass; //todo: AudioNode | tone
  }

  class Max extends Signal {
      constructor(max?: number);
      dispose(): this;
  }

  class Merge extends Tone {
      constructor();
      left: GainNode;
      right: GainNode;
      dispose(): this;
  }

  class Meter extends Tone {
      constructor(channels?: number, smoothing?: number, clipMemory?:number);
      dispose(): this;
      getDb(channel?:number): number;
      getLevel(channel?:number): number;
      getValue(channel?:number): number;
      isClipped(): boolean;
  }

  class Microphone extends Source {
      constructor(inputNum?: number);
      dispose(): this;
  }

  class MidSideEffect extends StereoEffect {
      midReturn: GainNode;
      midSend: Expr;
      sideReturn: GainNode;
      sideSend: Expr;
      dispose(): this;
  }

  class Min extends Signal {
      constructor(min: number);
      dispose(): this;
  }

  class Modulo extends SignalBase {
      constructor(modulus: number, bits?:number);
      value: number;
      dispose(): this;
  }

  class Mono extends Tone {
      constructor();
      dispose(): this;
  }

  class Monophonic extends Instrument {
      constructor();
      portamento: Time;
      setNote(note: any):Monophonic; //Todo: number | string
  }

  class MonoSynth extends Monophonic {
      constructor(options?: any);
      detune: Signal;
      envelope: Envelope;
      filter: Filter;
      filterEnvelope: Envelope;
      frequency: Signal;
      oscillator: OmniOscillator;
      dispose(): this;
      triggerEnvelopeAttack(time?: Time, velocity?: number): MonoSynth;
      triggerEnvelopeRelease(time?: Time): MonoSynth;
  }

  class MultibandCompressor extends Tone {
      constructor(options: Object);
      high: Compressor;
      highFrequency: Signal;
      low: Compressor;
      lowFrequency: Signal;
      mid: Compressor;
      dispose(): this;
  }

  class MultibandEQ extends Tone {
      constructor(options?: any);
      //set(params: Object): void;
      setType(type: string, band: number): void;
      getType(band: number): string;
      setFrequency(freq: number, band: number): void;
      getFrequency(band: number): number;
      setQ(Q: number, band: number): void;
      getQ(band: number): number;
      getGain(band: number): number;
      setGain(gain: number, band: number): void;
  }

  class MultibandSplit extends Tone {
      constructor(lowFrequency: number, highFrequency: number);
      high: Filter;
      highFrequency: Signal;
      low: Filter;
      lowFrequency: Signal;
      mid: Filter;
      dispose(): this;
  }

  class Multiply extends Signal {
      constructor(value?: number);
      dispose(): this;
  }

  class Negate extends SignalBase {
      constructor();
      dispose(): this;
  }

  class Noise extends Source {
      constructor(type: string);
      type: string;
      dispose(): this;
  }

  class NoiseSynth extends Instrument {
      constructor(options?: Object);
      envelope: Envelope;
      filter: Filter;
      filterEnvelope: Envelope;
      noise: Noise;
      dispose(): this;
      triggerAttack(time?: Time, velocity?: number): NoiseSynth;
      triggerAttackRelease(duration: Time, time?: Time, velocity?: number): NoiseSynth;
      triggerRelease(time?: Time): NoiseSynth;
  }

  class Normalize extends SignalBase {
      constructor(min?: number, max?: number);
      max: number;
      min: number;
      dispose(): this;
  }

  class Note {
      constructor(channel: any, time:Time, value: any); //todo: channel: number|string, value: string|number|Object|Array
      value: any; //todo: string | number | Object
      parseScore(score: Object): Note[];
      route(channel:any, callback?: (e: any)=>any): void; //todo: string | number
      unroute(channel: any, callback?: (e: any)=>any): void; //todo: string | number;
      dispose(): this;
  }

  class OmniOscillator extends Source {
      constructor(frequency?: Frequency, type?: string); //TODO: Number || Object
      detune: Signal;
      frequency: Signal;
      modulationFrequency: Signal;
      phase: number;
      type: string;
      width: Signal;
      dispose(): this;
  }

  class OR extends SignalBase {
      constructor(inputCount?:number);
      dispose(): this;
  }

  class Oscillator extends Source {
      constructor(frequency?: any, type?: string); //todo: number | string
      detune: Signal;
      frequency: Signal;
      phase: number;
      type: string;
      dispose(): this;
      syncFrequency(): Oscillator;
      unsyncFrequency(): Oscillator;
  }

  class Panner extends AudioNode {
      constructor(initialPan?: number);
      pan: Signal;
      dispose(): this;
  }

  class PanVol extends Tone {
      constructor(pan: number, volume: number);
      output: GainNode;
      volume: Signal;
      dispose(): this;
  }

  class Phaser extends StereoEffect {
      constructor(rate?: any, depth?: number, baseFrequency?: number); //TODO: change 'any' to 'number | Object'
      baseFrequency: number;
      depth: number;
      frequency: Signal;
      dispose(): this;
  }

  class PingPongDelay extends StereoXFeedbackEffect {
      constructor(delayTime?: any, feedback?: number); //TODO: Time || Object
      delayTime: Signal;
      dispose(): this;
  }

  class Player extends Source {
      constructor(url?: string, onload?: (e: any)=>any); //todo: string | AudioBuffer
      buffer: AudioBuffer;
      duration: number;
      loop: boolean;
      loopEnd: Time;
      loopStart: Time;
      playbackRate: number;
      retrigger: boolean;
      dispose(): this;
      load(url:string, callback?:(e: any)=>any):  Player;
      setLoopPoints(loopStart:Time, loopEnd:Time): Player;
  }

  class PluckSynth extends Instrument {
      constructor(options?: Object);
      attackNoise: number;
      dampening: Signal;
      resonance: Signal;
      dispose(): this;
      triggerAttack(note: any, time?: Time): PluckSynth; //todo: string | number
  }

  // @ts-ignore
  class PolySynth extends Instrument {
      constructor(voicesAmount?: any, voice?: { new(): Synth }); // number | Object
      voices: any[];
      dispose(): this;
      get(params?: any[]): any;
      set(params: Object): void;
      setPreset(presetName: string): PolySynth;
      triggerAttack(notes: any, time?: Time, velocity?: number): PolySynth; //todo: string | number | Object| string[] | number[]
      triggerAttackRelease(notes: any, duration: Time, time?: Time, velocity?: number): PolySynth; //todo: string | number | Object | string[] | number[]
      triggerRelease(value: any, time?: Time): PolySynth; //todo: string | number | Object | string[] | number[]
  }

  class Pow extends SignalBase {
      constructor(exp: number);
      value: number;
      dispose(): this;
  }

  class PulseOscillator extends Oscillator {
      constructor(frequency?: number, width?:number);
      detune: Signal;
      frequency: Signal;
      phase: number;
      width: Signal;
      dispose(): this;
  }

  class PWMOscillator extends Oscillator {
      constructor(frequency?: Frequency, modulationFrequency?: number);
      detune: Signal;
      frequency: Signal;
      modulationFrequency :Signal;
      phase: number;
      width: Signal;
      dispose(): this;
  }

  class Route extends SignalBase {
      constructor(outputCount?: number);
      gate: Signal;
      dispose(): this;
      select(which?: number, time?: Time): Route;
  }

  class Sampler extends Instrument {
      constructor(urls: any, options?: Object); //todo: Object | string
      envelope: Envelope;
      filter: BiquadFilterNode;
      filterEnvelope: Envelope;
      pitch: number;
      player: Player;
      sample: any; //todo: number | string
      dispose(): this;
      triggerAttack(sample?: string, time?: Time, velocity?: number): Sampler;
      triggerRelease(time?: Time): Sampler;
  }

  class Scale extends SignalBase {
      constructor(outputMin?: number, outputMax?: number);
      max: number;
      min: number;
      dispose(): this;
  }

  class ScaledEnvelope extends Envelope {
      constructor(attack?: any, decay?: Time, sustain?: number, release?:Time); //TODO: Change 'any' to 'Time | Object'
      exponent: number;
      max: number;
      min: number;
      dispose(): this;
  }

  class ScaleExp extends SignalBase {
      constructor(outputMin?: number, outputMax?: number, exponent?: number);
      exponent: number;
      max: number;
      min: number;
      dispose(): this;
  }

  class Select extends SignalBase {
      constructor(sourceCount?: number);
      gate: Signal;
      dispose(): this;
      select(which: number, time?: Time): Select;
  }

  module Signal {
      class Unit{}
      class Type{}
  }

  class Signal extends SignalBase {
      constructor(value?: any, units?: Signal.Unit); //todo: number | AudioParam
      units: Signal.Type;
      value: any; //TODO: Time | Frequency | number
      cancelScheduledValues(startTime: Time): Signal;
      dispose(): this;
      exponentialRampToValueAtTime(value: number, endTime: Time): Signal;
      exponentialRampToValueNow(value: number, rampTime: Time): Signal;
      linearRampToValueAtTime(value: number, endTime: Time): Signal;
      linearRampToValueNow(value: number, rampTime: Time): Signal;
      rampTo(value: number, rampTime: Time): Signal;
      setCurrentValueNow(now?: number): Signal;
      setTargetAtTime(value: number, startTime: Time, timeConstant: number): Signal;
      setValueAtTime(value: number, time: Time): Signal;
      setValueCurveAtTime(values: number[], startTime: Time, duration: Time): Signal;
  }

  class SignalBase extends Tone {
      connect(node: any, outputNumber?: number, inputNumber?: number): SignalBase; //TODO: Change 'any' to 'AudioParam | AudioNode | Signal | tone' when available
  }

  class Source extends Tone {
      State: string;
      onended: ()=>any;
      state: Source.State;
      volume: Signal;
      dispose(): this;
      start(time?: Time): Source;
      stop(time?: Time): Source;
      sync(delay?: Time): Source;
      unsync(): Source;
  }

  module Source {
      class State{}
  }

  class Split extends Tone {
      left: GainNode;
      right: GainNode;
      dispose(): this;
  }

  class StereoEffect extends Effect {
      effectReturnL: GainNode;
      effectReturnR: GainNode;
      dispose(): this;
  }

  class StereoFeedbackEffect extends FeedbackEffect {
      feedback: Signal;
      dispose(): this;
  }

  class StereoWidener extends MidSideEffect {
      constructor(width?: any); //TODO change 'any' to 'number | Object'
      width: Signal;
      dispose(): this;
  }

  class StereoXFeedbackEffect extends FeedbackEffect {
      feedback: Signal;
      dispose(): this;
  }

  class Switch extends SignalBase {
      gate: Signal;
      close(time: Time): Switch;
      dispose(): this;
      open(time: Time): Switch
  }

  class Synth extends Monophonic {
    constructor(options?: any) // TODO fix any
  }

  class Time{}

  class Transport extends Tone {
      static bpm: Signal;
      loop: boolean;
      loopEnd: Time;
      loopStart: Time;
      position: string;
      state: TransportState;
      swing: number;
      swingSubdivision: Time;
      timeSignature: number;
      clearInterval(rmInterval: number): boolean;
      clearIntervals(): void;
      clearTimeline(timelineID: number): boolean;
      clearTimelines(): void;
      clearTimeout(timeoutID: number): boolean;
      clearTimeouts(): void;
      dispose(): this;
      nextBeat(subdivision?: string): number;
      pause(time: Time): Transport;
      setInterval(callback: (e: any)=>any, interval: Time): number;
      setLoopPoints(startPosition: Time, endPosition: Time): Transport;
      setTimeline(callback: (e: any)=>any, timeout: Time): number;
      setTimeout(callback: (e: any)=>any, time: Time): number;
      static start(time?: Time, offset?: Time): Transport;
      static stop(time?: Time): Transport;
      syncSignal(signal: Signal, ratio?: number): Transport;
      syncSource(source: Source, delay: Time): Transport;
      unsyncSignal(signal: Signal): Transport;
      unsyncSource(source: Source): Transport;
  }

  class TransportState {}

  class WaveShaper extends SignalBase {
      constructor(mapping: any, bufferLen?: number); //TODO: change 'any' to 'Function | Array | number'
      curve: number[];
      oversample: string;
  }
}
