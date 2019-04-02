import * as t from 'io-ts';
import { PointType, IPoint, Point } from '@/core/automation/point';
import uuid from 'uuid';
import * as Audio from '@/modules/audio';
import { toTickTime } from '@/utils';
import { Serializable } from './serializable';
import { Channel } from './channel';
import { Instrument } from './instrument/instrument';
import { Beats } from './types';

export const AutomationType = t.type({
  context: t.union([t.literal('channel'), t.literal('instrument')]),
  contextId: t.string,
  attr: t.string,
  id: t.string,
  points: t.array(PointType),
});

export type IAutomation = t.TypeOf<typeof AutomationType>;

export type ClipContext = IAutomation['context'];
export type Automatable = Channel | Instrument<any, any>;

export class AutomationClip implements Serializable<IAutomation> {
  public static create(length: number, signal: Audio.Signal, context: ClipContext, id: string, attr: string) {
    const ac = new AutomationClip(signal, {
      id: uuid.v4(),
      context,
      contextId: id,
      points: [
        {
          time: 0,
          value: signal.value,
        },
        {
          time: length,
          value: signal.value,
        },
      ],
      attr,
    });

    return ac;
  }

  public points: Point[] = [];
  public context: ClipContext;
  public contextId: string;
  public attr: string;
  public id: string;

  public control: Audio.Controller;
  private signal: Audio.Signal;

  constructor(signal: Audio.Signal, i: IAutomation) {
    this.context = i.context;
    this.contextId = i.contextId;
    this.attr = i.attr;
    this.id = i.id;

    this.signal = signal;
    this.control = new Audio.Controller(signal);

    this.points = i.points.map((point) => {
      return this.schedule(point);
    });
  }

  get duration() {
    if (!this.points.length) {
      return 0;
    }

    return this.points[this.points.length - 1].time;
  }

  get minValue() {
    return this.signal.minValue;
  }

  get maxValue() {
    return this.signal.maxValue;
  }

  public setValue(index: number, value: number) {
    const point = this.points[index];
    this.control.change(point.eventId, value);
    this.points[index].value = value;
  }

  public setTime(index: number, time: Beats) {
    const point = this.points[index];
    this.control.setTime(point.eventId, toTickTime(time));
    this.points[index].time = time;
  }

  public remove(i: number) {
    const point = this.points[i];
    this.control.remove(point.eventId);
    this.points.splice(i, 1);
  }

  public add(time: Beats, value: number) {
    this.points.push(this.schedule({ time, value }));
  }

  public serialize() {
    return {
      context: this.context,
      contextId: this.contextId,
      attr: this.attr,
      id: this.id,
      points: this.points.map((point) => point.serialize()),
    };
  }

  public dispose() {
    this.control.dispose();
  }

  private schedule(iPoint: IPoint) {
    const eventId = this.control.add(toTickTime(iPoint.time), iPoint.value);
    const point = new Point(iPoint, eventId);
    return point;
  }
}
