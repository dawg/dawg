import * as t from 'io-ts';
import { Beats } from '@/core/types';

export const PointType = t.type({
  time: t.number,
  value: t.number,
});

export type IPoint = t.TypeOf<typeof PointType>;

export class Point {
  public time: Beats;
  public value: number;

  constructor(i: IPoint, public eventId: string) {
    this.time = i.time;
    this.value = i.value;
  }
}
