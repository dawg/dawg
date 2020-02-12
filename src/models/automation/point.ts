import * as t from '@/lib/io';
import { Beats } from '@/models/types';
import { Serializable } from '@/models/serializable';

export const PointType = t.type({
  time: t.number,
  value: t.number,
});

export type IPoint = t.TypeOf<typeof PointType>;

export class Point implements Serializable<IPoint> {
  public time: Beats;
  public value: number;

  constructor(i: IPoint, public eventId: string) {
    this.time = i.time;
    this.value = i.value;
  }

  public serialize() {
    return {
      time: this.time,
      value: this.value,
    };
  }
}
