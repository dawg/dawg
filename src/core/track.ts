import * as t from 'io-ts';

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

  public name: string;
  public mute: boolean;

  constructor(i: ITrack) {
    this.name = i.name;
    this.mute = i.mute;
  }

  public serialize(): ITrack {
    return {
      name: this.name,
      mute: this.mute,
    };
  }
}
