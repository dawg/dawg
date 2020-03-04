declare module 'envelope-generator' {
  interface Options {
    curve: "linear",
    attackCurve: "linear",
    decayCurve: "linear",
    releaseCurve: "linear",
    initialValueCurve: Float32Array,
    releaseValueCurve: Float32Array,
    sampleRate: number;
    delayTime: number;
    startLevel: number;
    maxLevel: number;
    attackTime: number;
    holdTime: number;
    decayTime: number;
    sustainLevel: number;
    releaseTime: number;
  }

  export default class {
    public attackDecayNode: GainNode;
    public releaseNode: GainNode;
    public ampNode: GainNode;
    public outputNode: GainNode;
    constructor(ac: AudioContext, options?: Partial<Options>);
    connect(param: AudioParam): void;
    start(time: number): void;
    stop(time: number): void;
  }
}