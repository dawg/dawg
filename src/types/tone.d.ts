declare module 'tone' {

    export const Master: AudioNode;
    
    export class AudioNode { 
        constructor(context?: any);
        connect(unit: AudioNode, outputNum?: number, inputNum?: number): this;
        disconnect(unit: AudioNode): this;
        toMaster(): this;
    }
    
    export class Synth extends AudioNode {
        constructor(options?: any) ;
        triggerAttackRelease(note: string, length: string, time?: string): void;
    }
    
    interface SynthClass {
        new (): Synth;
    }

    class BPM {
        value: number;
    }
    
    export class Transport {
        static start(): void;
        static stop(): void;
        static bpm: BPM
    }

    export class PolySynth {
        constructor(polyphony: number, voice: SynthClass, options: object);
        toMaster(): PolySynth;
        triggerAttackRelease(note: string, length: string, time?: string): void;
    }

    export class Part {
        constructor(callback: (time: string, chord: string) => ({}))
    }

    export class OmniOscillator {
        constructor(frequency: string, type: string);
    }

    export class Panner extends AudioNode {
        constructor(initialPan?: number);
    }

}