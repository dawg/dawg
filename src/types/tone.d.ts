// Type definitions for TONE.JS
// Project: https://github.com/Tonejs/js
// Definitions by: Luke Phillips <https://github.com/lukephills>
//                 Pouya Kary <https://github.com/pmkary>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

//var tone: {
//    new(inputs?: number, outputs?: number): Tone;
//}

type PrimitiveTime = string | number;
type PrimitiveTicks = number;

declare module 'tone' {
  var context: Context;

  class Tone {
    constructor(inputs?: number, outputs?: number);
    context: Context;
    toFrequency(freq: any): number;
    toSeconds(time?: _TimeArg): number;
    toTicks(time: _TimeArg): number;
    

    static connectSeries(...args: any[]): Tone;
    static dbToGain(db: number): number;
    static defaultArg(given: any, fallback: any): any;
    static defaults(): object;
    static isFunction(arg: any): boolean;
    static isArray(arg: any): boolean;
    static isNumber(arg: any): boolean;
    static isString(arg: any): boolean;
    static isObject(arg: any): boolean;
    static now(): number;
    static isDefined(arg: any): boolean; 
    protected _readOnly(property: keyof this & string): void;
  }

  class Abs extends SignalBase {
      dispose(): this;
  }

  class Add extends Signal {
      constructor(value?:number);
      dispose(): this;
  }

  class AmplitudeEnvelope extends Envelope {
    constructor(attack?: any, decay?: _TimeArg, sustain?: number, release?:_TimeArg); //TODO: Change 'any' to '_TimeArg | Object'
    dispose(): this;
  }

  class AMSynth extends Monophonic {
      constructor(options?: Object);
      carrier: MonoSynth;
      frequency: Signal;
      harmonicity: number;
      modulator: MonoSynth;
      dispose(): this;
      triggerEnvelopeAttack(time?: _TimeArg, velocity?: number): AMSynth;
      triggerEnvelopeRelease(time?: _TimeArg): AMSynth;
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
    toMaster(): this;
    disconnect(output: number | AudioNode): this;
    connect(unit: Tone | AudioParam | AudioNode, outputNum?:number, inputNum?:number): this;
  }

  class AutoPanner extends Effect {
      constructor(frequency?: any); //TODO: Number || Object
      amount: Signal;
      frequency: Signal;
      type: string;
      dispose(): this;
      start(time?: Time): AutoPanner;
      stop(time?: _TimeArg): AutoPanner;
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
    constructor(bits?: number);
    bits: number;
    dispose(): this;
  }

  class Buffer extends Tone {
    constructor(url: AudioBuffer | string);
    MAX_SIMULTANEOUS_DOWNLOADS: number;
    duration: number; // Readonly
    loaded: boolean; // Readonly
    onload: (e: any)=>any;
    url: string; // Readonly
    static load(url: string, onload: (buff: AudioBuffer) => void, onerror: (e: Error) => void): void;
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

  interface _Clock {
    callback: (tickTime: number, ticks: number) => void,
    frequency: number,
  }

  class Clock extends Emitter<{ start: [number], stop: [number], pause: [number] }> {
    constructor(options: _Clock);
    frequency: TickSignal;
    seconds: number;
    ticks: number;
    state: TransportState;
    setTicksAtTime(ticks: number, time: _TimeArg): void;
    getSecondsAtTime(time: _TimeArg): number;
    getStateAtTime(time: _TimeArg): TransportState;
    getTicksAtTime(time: PrimitiveTime): PrimitiveTicks;
    start(time?: PrimitiveTime, offset?: PrimitiveTicks): void;
    stop(time?: PrimitiveTime): void;
    pause(time?: PrimitiveTime): void;
  }

  class Compressor extends AudioNode {
    constructor(threshold?: any, ratio?: number); //TODO: Number || Object
    attack: Signal;
    knee: AudioParam;
    ratio: AudioParam;
    release: Signal;
    threshold: AudioParam;
    dispose(): this;
  }

  class Context extends Emitter<{tick: any}> {
    resume(): Promise<void>;
    now(): number;
    decodeAudioData(audioData: ArrayBuffer): Promise<AudioBuffer>;
    createBuffer(numberOfChannels: number, length: number, sampleRate: number): AudioBuffer;
  }



  class Convolver extends Effect {
      constructor(url: any); //TODO: Change any to 'string | AudioBuffer' when available
      buffer: AudioBuffer;
      load(url: string, callback?: (e: any)=>any): Convolver;
      dispose(): this;
  }

  class CrossFade extends Tone {
      constructor(initialFade?: number);
      a: Gain;
      b: Gain;
      fade: Signal;
      dispose(): this;
  }

  class Distortion extends Effect {
      constructor(distortion?: number);
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
      triggerEnvelopeAttack(time?: _TimeArg, velocity?: number): DuoSynth;
      triggerEnvelopeRelease(time?: _TimeArg): DuoSynth;
  }

  class Effect extends AudioNode {
    constructor(initialWet?: number);
    wet: Signal;
    bypass(): Effect;
    dispose(): this;
  }

  class Emitter<T extends { [k: string]: any[] }, V extends keyof T = keyof T> extends Tone {
    emit<Z extends V>(event: Z, ...args: T[Z]): this;
    on<Z extends V>(event: Z, callback: (...args: T[Z]) => void): this;
    once<Z extends V>(event: Z, callback: (...arg: T[Z]) => void): this;
    off<Z extends V>(event: Z, callback: (...arg: T[Z]) => void): this;
  }

  class Envelope extends Tone {
    constructor(attack: any, decay?: _TimeArg, sustain?: number, release?: _TimeArg);  //TODO: Change 'any' to '_TimeArg | Object'
    attack: _TimeArg;
    decay: _TimeArg;
    release: _TimeArg;
    sustain: number;
    dispose(): this;
    triggerAttack(time?: _TimeArg, velocity?: number): Envelope;
    triggerAttackRelease(duration: _TimeArg, time?: _TimeArg, velocity?: number): Envelope;
    triggerRelease(time?: _TimeArg): Envelope;
  }

  class EQ3 extends AudioNode {
      constructor(lowLevel?: any, midLevel?: number, highLevel?: number); //TODO: Change 'any' to 'number | Object'
      highFrequency: Signal;
      high: Gain;
      lowFrequency: Signal;
      low: Gain;
      mid: Gain;
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
      delayTime: _TimeArg;
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
    triggerEnvelopeAttack(time?: _TimeArg, velocity?: number): FMSynth;
    triggerEnvelopeRelease(time?: _TimeArg): FMSynth;
  }

  class Follower extends Tone {
    constructor(attack?: _TimeArg, release?: _TimeArg);  
    attack: _TimeArg;
    release: _TimeArg;
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
    add ( val: _TimeArg, units?: string ): TimeBase;
    sub ( val: _TimeArg, units?: string ): TimeBase;
    mult ( val: _TimeArg, units?: string ): TimeBase;
    div ( val: _TimeArg, units?: string ): TimeBase;
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
    constructor(thresh?: number, attackTime?: _TimeArg, releaseTime?: _TimeArg);
    attack: _TimeArg;
    release: _TimeArg;
    threshold: _TimeArg;
    dispose(): this;
  }

  class Gain extends AudioNode {
    gain: Signal;
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
      triggerAttackRelease(note: any, duration: _TimeArg, time?: _TimeArg, velocity?: number): Instrument; //Todo: string | number
      dispose(): this;
  }

  class IntervalTimeline extends Tone {
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
      constructor(frequency?: _TimeArg, outputMin?: number, outputMax?: number); //TODO: Number || Object
      amplitude: Signal;
      frequency: Signal;
      max: number;
      min: number;
      oscillator: Oscillator;
      phase: number;
      type: string;
      dispose(): this;
      start(time?: _TimeArg): LFO;
      stop(time?: _TimeArg): LFO;
      sync(delay?: _TimeArg): LFO;
      unsync(): LFO;
  }

  class Limiter extends AudioNode {
    constructor(threshold?: AudioParam);
    dispose(): this;
  }

  class LowpassCombFilter extends Tone {
      constructor(minDelay?: number, maxDelay?: number)
      dampening: Signal;
      delayTime: _TimeArg;
      resonance: Signal;
      dispose(): this;
      setDelayTimeAtTime(delayAmount: _TimeArg, time?: _TimeArg): LowpassCombFilter;
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
      left: Gain;
      right: Gain;
      dispose(): this;
  }

  class Meter extends AudioNode {
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
      midReturn: Gain;
      midSend: Expr;
      sideReturn: Gain;
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
    portamento: _TimeArg;
    setNote(note: any): Monophonic; //Todo: number | string
    triggerAttack(note: any, time?: PrimitiveTime, velocity?: number): void;
    triggerRelease(time?: PrimitiveTime): void;
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
    triggerEnvelopeAttack(time?: _TimeArg, velocity?: number): MonoSynth;
    triggerEnvelopeRelease(time?: _TimeArg): MonoSynth;
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
      triggerAttack(time?: _TimeArg, velocity?: number): NoiseSynth;
      triggerAttackRelease(duration: _TimeArg, time?: _TimeArg, velocity?: number): NoiseSynth;
      triggerRelease(time?: _TimeArg): NoiseSynth;
  }

  class Normalize extends SignalBase {
      constructor(min?: number, max?: number);
      max: number;
      min: number;
      dispose(): this;
  }

  class Note {
      constructor(channel: any, time:_TimeArg, value: any); //todo: channel: number|string, value: string|number|Object|Array
      value: any; //todo: string | number | Object
      parseScore(score: Object): Note[];
      route(channel:any, callback?: (e: any)=>any): void; //todo: string | number
      unroute(channel: any, callback?: (e: any)=>any): void; //todo: string | number;
      dispose(): this;
  }

  class OfflineContext extends Context {
    constructor(channels: number, duration: number, sampleRate: number);
    render(): Promise<void>;
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
    output: Gain;
    volume: Signal;
    dispose(): this;
  }

  class Part<T> extends Event {
    constructor(callback?: (time: string, value: T) => void, events?: Event[])
    start(time: number, offset?: _TimeArg): void;
    loop: boolean
    readonly progress: number;
    mute: boolean;
    readonly state: 'started' | 'stopped';
    humanize: boolean
    loopEnd: _TimeArg
    loopStart: _TimeArg
    add(time: _TimeArg, value: T): void // TODO
    remove(time: _TimeArg, value: T): void // TODO
  }

  class Phaser extends StereoEffect {
    constructor(rate?: any, depth?: number, baseFrequency?: number); //TODO: change 'any' to 'number | Object'
    baseFrequency: number;
    depth: number;
    frequency: Signal;
    dispose(): this;
  }

  class PingPongDelay extends StereoXFeedbackEffect {
    constructor(delayTime?: any, feedback?: number); //TODO: _TimeArg || Object
    delayTime: Signal;
    dispose(): this;
  }

  class Player extends Source {
    constructor(url?: string | AudioBuffer, onload?: (e: any)=>any); //todo: string | AudioBuffer
    buffer: Buffer;
    duration: number;
    loop: boolean;
    loopEnd: _TimeArg;
    loopStart: _TimeArg;
    playbackRate: number;
    retrigger: boolean;
    autostart: boolean;
    dispose(): this;
    load(url:string, callback?:(e: any)=>any):  Player;
    setLoopPoints(loopStart: _TimeArg, loopEnd: _TimeArg): Player;
    toMaster(): this;
  }

  class PluckSynth extends Instrument {
      constructor(options?: Object);
      attackNoise: number;
      dampening: Signal;
      resonance: Signal;
      dispose(): this;
      triggerAttack(note: any, time?: _TimeArg): PluckSynth; //todo: string | number
  }

  // @ts-ignore
  class PolySynth extends Instrument {
      constructor(voicesAmount?: number, voice?: { new(): Synth }); // number | Object
      voices: any[];
      dispose(): this;
      get(params?: any[]): any;
      set(params: Object): void;
      setPreset(presetName: string): PolySynth;
      triggerAttack(notes: any, time?: _TimeArg, velocity?: number): PolySynth; //todo: string | number | Object| string[] | number[]
      triggerAttackRelease(notes: any, duration: _TimeArg, time?: _TimeArg, velocity?: number): PolySynth; //todo: string | number | Object | string[] | number[]
      triggerRelease(value: string | string[], time?: _TimeArg): PolySynth; //todo: string | number | Object | string[] | number[]
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
      select(which?: number, time?: _TimeArg): Route;
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
      triggerAttack(sample?: string, time?: _TimeArg, velocity?: number): Sampler;
      triggerRelease(time?: _TimeArg): Sampler;
  }

  class Scale extends SignalBase {
      constructor(outputMin?: number, outputMax?: number);
      max: number;
      min: number;
      dispose(): this;
  }

  class ScaledEnvelope extends Envelope {
      constructor(attack?: any, decay?: _TimeArg, sustain?: number, release?:_TimeArg); //TODO: Change 'any' to '_TimeArg | Object'
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
      select(which: number, time?: _TimeArg): Select;
  }

  module Sig {
    class Unit{}
    class Type{}
  }

  class Signal extends SignalBase {
      constructor(value?: any, units?: Sig.Unit); //todo: number | AudioParam
      units: Sig.Type;
      value: any; //TODO: _TimeArg | Frequency | number
      cancelScheduledValues(startTime: _TimeArg): this;
      dispose(): this;
      exponentialRampToValueAtTime(value: number, endTime: _TimeArg): this;
      exponentialRampToValueNow(value: number, rampTime: _TimeArg): this;
      linearRampToValueAtTime(value: number, endTime: _TimeArg): this;
      linearRampToValueNow(value: number, rampTime: _TimeArg): this;
      rampTo(value: number, rampTime: _TimeArg): this;
      setCurrentValueNow(now?: number): this;
      setTargetAtTime(value: number, startTime: _TimeArg, timeConstant: number): this;
      getValueAtTime(tiem: _TimeArg): number;
      setValueAtTime(value: number, time: _TimeArg): this;
      setValueCurveAtTime(values: number[], startTime: _TimeArg, duration: _TimeArg): this;
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
      start(startTime?: _TimeArg, offset?: _TimeArg, duration?: _TimeArg): Source;
      stop(time?: _TimeArg): Source;
      sync(delay?: _TimeArg): Source;
      unsync(): Source;
  }

  module Source {
      class State{}
  }

  class Split extends Tone {
      left: Gain;
      right: Gain;
      dispose(): this;
  }

  class StereoEffect extends Effect {
      effectReturnL: Gain;
      effectReturnR: Gain;
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
    close(time: _TimeArg): Switch;
    dispose(): this;
    open(time: _TimeArg): Switch
  }

  class Synth extends Monophonic {
    constructor(options?: any) // TODO fix any
  }

  class Ticks extends TransportTime {
    constructor(val: string | number, units?: string);
    toTicks(): PrimitiveTicks;
  }

  class TickSignal extends Signal {
    _toUnits(value: number): number;
    _fromUnits(value: number): number;
    getDurationOfTicks(ticks: number, time: _TimeArg): void;
    timeToTicks(duration: PrimitiveTime, when?: PrimitiveTime): Ticks;
    getTicksAtTime(time: PrimitiveTime): PrimitiveTicks;
    getTimeOfTick(tick: PrimitiveTicks): number;
  }

  class TickSource extends Tone {
    frequency: TickSignal;
    start(time?: PrimitiveTime, offset?: PrimitiveTicks): this;
    pause(time?: PrimitiveTime): void;
    stop(time: PrimitiveTime): this;
    getTicksAtTime(time: PrimitiveTime): PrimitiveTicks;
    setTicksAtTime(time: PrimitiveTime, offset: PrimitiveTicks): this;
    forEachTickBetween(startTime: PrimitiveTime, endTime: PrimitiveTime, callback: (time: number, ticks: number) => void): this;
    dispose(): void;
  }

  class Time extends TimeBase {
    constructor(val: string | number, units?: string);
    toSeconds(): number;
    toBarsBeatsSixteenths(): string;
  }

  class Timeline<T extends { time: Time }> extends Tone {
    length: number;
    add(event: T): void;
    get(time: number, comparator?: keyof T): T;
    forEach(callback: (event: T) => void): void;
    forEachAtTime(time: number, callback: (event: T) => void): void;
    forEachBetween(startTime: number, endTime: number, callback: (e: T) => void): this;
    forEachFrom(time: number, callback: (event: T) => void): void;
    remove(event: T): void;
  }

  class TimelineState extends Timeline<{state: TransportState, time: Time}> {
    constructor(initial: string);
    cancel(time: number): this;
    setStateAtTime(state: TransportState, time: number): this;
    getValueAtTime(time: number): TransportState;
  }

  type _TimeArg = string | number | Time;

  class _TransportConstructor extends Tone {
    bpm: Signal;
    seconds: number;
    loop: boolean;
    loopEnd: _TimeArg;
    loopStart: _TimeArg;
    position: string;
    progress: number;
    state: TransportState;
    swing: number;
    swingSubdivision: _TimeArg;
    timeSignature: number;
    PPQ: number;
    clearInterval(rmInterval: number): boolean;
    clearIntervals(): void;
    clearTimeline(timelineID: number): boolean;
    clearTimelines(): void;
    clearTimeout(timeoutID: number): boolean;
    clearTimeouts(): void;
    dispose(): this;
    nextBeat(subdivision?: string): number;
    pause(time: _TimeArg): Transport;
    setInterval(callback: (e: any)=>any, interval: _TimeArg): number;
    setLoopPoints(startPosition: _TimeArg, endPosition: _TimeArg): Transport;
    setTimeline(callback: (e: any)=>any, timeout: _TimeArg): number;
    setTimeout(callback: (e: any)=>any, time: _TimeArg): number;
    start(time?: _TimeArg, offset?: _TimeArg): Transport;
    stop(time?: _TimeArg): Transport;
    pause(time?: _TimeArg): Transport;
    syncSignal(signal: Signal, ratio?: number): Transport;
    syncSource(source: Source, delay: _TimeArg): Transport;
    unsyncSignal(signal: Signal): Transport;
    unsyncSource(source: Source): Transport;
  }

  var Transport: _TransportConstructor;

  type TransportCallback = (exact: number, ticks: number) => void;

  // TODO callback ^^ is wrong
  class TransportEvent extends Tone {
    constructor(transport: _TransportConstructor, options: { time: TransportTime, callback: TransportCallback })
    id: string;
    time: Ticks;
    callback: TransportCallback;
    invoke(exact: number, ticks: number): void;
    dispose(): void;
  }

  class _TransportRepeatEventOptions {
    callback: TransportCallback;
    interval: Time;
    time: Time;
    duration: Time;
  }

  class TransportRepeatEvent extends TransportEvent {
    constructor(transport: _TransportConstructor, options: _TransportRepeatEventOptions)
  }

  type TransportState = 'started' | 'stopped' | 'paused';

  class TransportTime extends Time {
    toTicks(): number;
  }

  class Tremolo extends StereoEffect {
  }

  class Type {
    static BPM: 'bpm';
  }

  class WaveShaper extends SignalBase {
    constructor(mapping: any, bufferLen?: number); //TODO: change 'any' to 'Function | Array | number'
    curve: number[];
    oversample: string;
  }

  class Waveform extends AudioNode {
      constructor(size?:number);
      readonly channelCount: number;
      readonly numberOfInputs: number;
      readonly numberOfOutputs: number;
      getValue(): Float32Array;
  }
}
