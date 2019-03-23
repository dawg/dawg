import soundfont from 'soundfont-player';
import Tone from 'tone';
import * as t from 'io-ts';
import * as Audio from '@/modules/audio';
import { Instrument, InstrumentType } from '@/core/instrument/instrument';
import { Serializable } from '../serializable';
import { literal } from '@/utils';

export const SoundfontType = t.intersection([
  t.type({
    soundfont: t.union([
      t.literal('acoustic_grand_piano'),
      t.literal('bright_acoustic_piano'),
    ]),
    instrument: t.literal('soundfont'),
  }),
  InstrumentType,
]);

export type ISoundfont = t.TypeOf<typeof SoundfontType>;

export class Soundfont extends Instrument<Audio.SoundfontOptions> implements Serializable<ISoundfont> {
  public static async create(i: ISoundfont) {
    const context = Tone.context as unknown as AudioContext;

    const player = await soundfont.instrument(
      context,
      name,
    );

    return new Soundfont(new Audio.Soundfont(player), i);
  }

  public soundfont: ISoundfont['soundfont'];

  constructor(player: Audio.Soundfont, i: ISoundfont) {
    super(player, i);
    this.soundfont = i.soundfont;
  }

  public serialize() {
    return {
      soundfont: this.soundfont,
      instrument: literal('soundfont'),
      volume: this.volume.value,
      pan: this.pan.value,
      name: this.name,
      id: this.id,
      channel: this.channel,
      mute: this.mute,
    };
  }
}
