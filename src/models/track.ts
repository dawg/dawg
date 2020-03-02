import * as t from '@/lib/io';
import * as oly from '@/olyger';

export const TrackType = t.type({
  mute: t.boolean,
  name: t.string,
});

export type ITrack = t.TypeOf<typeof TrackType>;

export class Track {
  public static create(i: number) {
    return new Track({
      name: `Track ${i}`,
      mute: false,
    });
  }

  public name: oly.OlyRef<string>;
  public mute: oly.OlyRef<boolean>;

  constructor(i: ITrack) {
    this.name = oly.olyRef(i.name);
    this.mute = oly.olyRef(i.mute);
  }

  public serialize(): ITrack {
    return {
      name: this.name.value,
      mute: this.mute.value,
    };
  }
}
