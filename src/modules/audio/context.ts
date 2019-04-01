import Tone from 'tone';

// @ts-ignore
export const context = Tone.context._context as unknown as AudioContext;
