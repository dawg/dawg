import soundfont from 'soundfont-player';
import Tone from 'tone';
import { Source } from '@/core/source';

export class Soundfont extends Source {
  constructor(player: soundfont.Player) {
    super();
  }
}

export const load = (name: soundfont.InstrumentName) => {
  const context = Tone.context as unknown as AudioContext;

  return soundfont.instrument(
    context,
    name,
  );
};

export default {
  load,
  Soundfont,
};
