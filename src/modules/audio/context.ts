import Tone from 'tone';
import { Ticks } from '@/modules/audio/types';

export const context = (Tone.context as any)._context as unknown as AudioContext;
export class Context {
  // TODO
  public static PPQ = 192;
  public static BPM = 120;

  public static ticksToSeconds(ticks: Ticks) {
    return (ticks / Context.PPQ) / Context.BPM / 60;
  }
  private constructor() {}
}
