declare module 'tone' {
    export class Synth {
        triggerAttackRelease(note: string, length: string, time?: string): void;
        toMaster(): Synth;
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
}