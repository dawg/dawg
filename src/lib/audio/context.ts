import { Ticks, Beat, Seconds, ContextTime } from '@/lib/audio/types';
import { defineProperties } from '@/lib/std';
import { emitter } from '@/lib/events';

interface Common {
  resume: () => Promise<void>;
}

export const enhanceBaseContext = <T extends BaseAudioContext & Common>(context: T) => {
  const events = emitter<{ setBPM: [number] }>();

  const state = {
    BPM: 120,
    PPQ: 192,
    lookAhead: 0.1,
  };

  const enhancements = {
    PPQ:  state.PPQ,
    lookAhead:  state.lookAhead,
    onDidSetBPM: (cb: (bpm: number) => void) => {
      return events.on('setBPM', cb);
    },
    round: (beats: Beat) => {
      return Math.round(beats * state.PPQ) / state.PPQ;
    },
    beatsToTicks: (beat: Beat): Ticks => {
      return Math.round(beat * state.PPQ);
    },
    ticksToSeconds(ticks: Ticks): Seconds {
      return (ticks / state.PPQ) / state.BPM * 60;
    },
    beatsToSeconds: (beat: Beat): Seconds => {
      return beat / state.BPM * 60;
    },
    now(): ContextTime {
      return context.currentTime + state.lookAhead;
    },
    dispose: () => {
      events.removeAllListeners();
    },
  };

  const contextWithProperties = defineProperties(context, {
    BPM: {
      get: () => state.BPM,
      set: (BPM: number) => {
        state.BPM = BPM;
        events.emit('setBPM', BPM);
      },
    },
    sampleTime: {
      get: () => 1 / context.sampleRate,
    },
    /**
     * The number of seconds of 1 processing block (128 samples)
     */
    blockTime: {
      get: () => 128 / context.sampleRate,
    },
  });

  return Object.assign(contextWithProperties, enhancements);
};

export type ObeoContext = ReturnType<typeof enhanceBaseContext>;
