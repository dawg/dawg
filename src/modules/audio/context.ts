import Tone from 'tone';
import { Ticks, Beat } from '@/modules/audio/types';
import { value } from 'vue-function-api';

export const context = (Tone.context as any)._context as unknown as AudioContext;
export class Context {
  public static PPQ = 192;
  public static BPM = value(120);

  public static ticksToSeconds(ticks: Ticks) {
    return (ticks / Context.PPQ) / Context.BPM.value / 60;
  }
  public static beatsToTicks(beat: Beat) {
    return beat * Context.PPQ;
  }
  private constructor() {}
}
