import { ObeoSynth, SynthParameters } from '@/lib/audio/synth';
import { ObeoInstrument } from '@/lib/audio/instrument';
import { createTrigger } from '@/lib/audio/util';
import { createVolume } from '@/lib/audio/volume';
import { Getter, getter, setter } from '@/lib/reactor';
import { keys } from '@/lib/std';

export interface ObeoPolySynthOptions {
  maxPolyphony: number;
}

// TODO remove and just use synth for now
type VoiceCreator = (options: { onended: () => void }) => ObeoSynth;

export interface ObeoPolySynth extends ObeoInstrument, SynthParameters {
  activeVoices: Getter<number>;
}

type Unwrapped = { [K in keyof SynthParameters]: SynthParameters[K]['value'] };

export const createPolySynth = (
  creator: VoiceCreator,
  options?: Partial<ObeoPolySynthOptions>,
): ObeoPolySynth => {
  const maxPolyphony = options?.maxPolyphony ?? 32;
  const voices: ObeoSynth[] = [];
  const availableVoices: ObeoSynth[] = [];
  // private _activeVoices: Array<{midi: MidiNote; voice: Voice; released: boolean}> = [];
  const out = createVolume();
  let activeVoices = 0;
  const parameters: Unwrapped = { type: 'sine' };

  /**
   * Get an available voice from the pool of available voices.
   * If one is not available and the maxPolyphony limit is reached,
   * steal a voice, otherwise return null.
   */
  const getNextAvailableVoice = (): ObeoSynth | undefined => {
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

      keys(parameters).forEach((key) => {
        voice[key].value = parameters[key];
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
    type: setter(() => {
      return parameters.type;
    }, (value) => {
      parameters.type = value;
      voices.forEach((voice) => voice.type.value = value);
    }),
  };
};
