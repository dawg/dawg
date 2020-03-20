import { ObeoSynth, createSynth } from '@/lib/audio/synth';
import { ObeoMonophonic } from '@/lib/audio/monophonic';
import { ObeoInstrument } from '@/lib/audio/instrument';
import { createTrigger } from '@/lib/audio/util';
import { createVolume } from '@/lib/audio/volume';
import { Getter, getter } from '@/lib/reactor';

export interface ObeoPolySynthOptions {
  maxPolyphony: number;
}

type VoiceCreator<T extends ObeoMonophonic & ObeoInstrument> = (options: { onended: () => void }) => T;

export interface ObeoPolySynth extends ObeoInstrument {
  activeVoices: Getter<number>;
}

export const createPolySynth = <T extends ObeoMonophonic & ObeoInstrument = ObeoSynth>(
  creator: VoiceCreator<T>,
  options?: Partial<ObeoPolySynthOptions>,
): ObeoPolySynth => {
  const maxPolyphony = options?.maxPolyphony ?? 32;
  const voices: T[] = [];
  const availableVoices: T[] = [];
  // private _activeVoices: Array<{midi: MidiNote; voice: Voice; released: boolean}> = [];
  const out = createVolume();
  let activeVoices = 0;

  /**
   * Get an available voice from the pool of available voices.
   * If one is not available and the maxPolyphony limit is reached,
   * steal a voice, otherwise return null.
   */
  const getNextAvailableVoice = (): T | undefined => {
    // if there are available voices, return the first one
    if (availableVoices.length) {
      return availableVoices.pop();
    } else if (voices.length < maxPolyphony) {
      // otherwise if there is still more maxPolyphony, make a new voice
      const voice = creator({
        onended: () => {
          activeVoices--;
          availableVoices.push(voice);
        },
      });

      voice.connect(out);
      voices.push(voice);
      return voice;
    } else {
      // tslint:disable-next-line:no-console
      console.warn('Max polyphony exceeded. Note dropped.');
    }
  };

  const trigger = createTrigger({
    triggerAttack: (note, time, velocity) => {
      const voice = getNextAvailableVoice();
      if (!voice) {
        return {
          triggerRelease: () => ({}),
        };
      }

      const releaser = voice.triggerAttack(note, time, velocity);
      activeVoices++;

      return releaser;
    },
  });

  return {
    ...trigger,
    ...out,
    activeVoices: getter(() => activeVoices),
    dispose: () => {
      voices.forEach((voice) => voice.dispose());
      out.dispose();
    },
  };
};
