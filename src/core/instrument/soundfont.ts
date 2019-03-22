import soundfont from 'soundfont-player';
import Tone from 'tone';
import * as t from 'io-ts';
import * as Audio from '@/modules/audio';
import { Instrument } from '@/core/instrument/instrument';

export const SoundfontType = t.type({
  name: t.union([
    t.literal('acoustic_grand_piano'),
    t.literal('bright_acoustic_piano'),
  ]),
});

type ISoundfont = t.TypeOf<typeof SoundfontType>;

export class Soundfont extends Instrument<Audio.SoundfontOptions> {
  public static async deserialize(i: ISoundfont) {
    const context = Tone.context as unknown as AudioContext;

    const player = await soundfont.instrument(
      context,
      name,
    );

    return new Soundfont(new Audio.Soundfont(player));
  }

  constructor(player: Audio.Soundfont) {
    super(player);
  }
}

export const load = (name: ISoundfont['name']) => {
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
