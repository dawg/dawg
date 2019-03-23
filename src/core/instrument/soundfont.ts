import soundfonts from 'soundfont-player';
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

export type Soundfonts = ISoundfont['soundfont'];

export class Soundfont extends Instrument<Audio.SoundfontOptions> implements Serializable<ISoundfont> {
  public static async create(soundfont: Soundfonts, name: string) {
    // @ts-ignore
    // TODO A bit of a hacky solution to make Tone.js work with soundfonts
    const context = Tone.context._context as unknown as AudioContext;

    const player = await soundfonts.instrument(context, soundfont);
    return new Soundfont(new Audio.Soundfont(player), Tone.Master, {
      soundfont: 'acoustic_grand_piano', // TODO(jacob)
      instrument: 'soundfont',
      name,
    });
  }

  public soundfont: ISoundfont['soundfont'];

  constructor(player: Audio.Soundfont, destination: Tone.AudioNode, i: ISoundfont) {
    super(player, destination, i);
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
