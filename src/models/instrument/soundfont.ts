import * as t from '@/lib/io';
import * as Audio from '@/lib/audio';
import { Instrument, InstrumentType } from '@/models/instrument/instrument';
import { Serializable } from '@/models/serializable';
import { literal } from '@/lib/std';

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
    return new Soundfont(await Audio.Soundfont.load(soundfont), {
      soundfont,
      instrument: 'soundfont',
      name,
    });
  }

  constructor(player: Audio.Soundfont | null, i: ISoundfont) {
    super(
      i.soundfont,
      ['acoustic_grand_piano', 'bright_acoustic_piano', 'acoustic_guitar_nylon'],
      player,
      i,
    );

    this.type.onDidChange(({ onExecute }) => {
      onExecute(() => {
        this.updateSource();
        return () => this.updateSource();
      });
    });
  }

  public serialize() {
    return {
      soundfont: this.type.value,
      instrument: literal('soundfont'),
      volume: this.volume.value,
      pan: this.pan.value,
      name: this.name.value,
      id: this.id,
      channel: this.channel.value,
      mute: this.input.mute,
    };
  }

  public online() {
    if (this.source === null) {
      this.updateSource();
    }
  }

  private async updateSource() {
    this.setSource(await Audio.Soundfont.load(this.type.value));
  }
}
