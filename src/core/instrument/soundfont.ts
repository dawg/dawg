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
      t.literal('acoustic_guitar_nylon'),
    ]),
    instrument: t.literal('soundfont'),
  }),
  InstrumentType,
]);

export type ISoundfont = t.TypeOf<typeof SoundfontType>;

export type Soundfonts = ISoundfont['soundfont'];

export class Soundfont extends Instrument<Audio.SoundfontOptions, Soundfonts> implements Serializable<ISoundfont> {
  public static async create(soundfont: Soundfonts, name: string) {
    const player = await soundfonts.instrument(Audio.context, soundfont);
    return new Soundfont(new Audio.Soundfont(player), Tone.Master, {
      soundfont,
      instrument: 'soundfont',
      name,
    });
  }

  public types: Soundfonts[] = ['acoustic_grand_piano', 'bright_acoustic_piano', 'acoustic_guitar_nylon'];

  private soundfont: Soundfonts;

  constructor(player: Audio.Soundfont, destination: Tone.AudioNode, i: ISoundfont) {
    super(player, destination, i);
    this.soundfont = i.soundfont;
  }

  get type() {
    return this.soundfont;
  }

  set type(soundfont: Soundfonts) {
    this.soundfont = soundfont;
    this.updateSource();
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

  private async updateSource() {
    const player = await soundfonts.instrument(Audio.context, this.soundfont);
    this.setSource(new Audio.Soundfont(player));
  }
}
