import * as t from '@/lib/io';
import uuid from 'uuid';
import * as Audio from '@/lib/audio';
import { Serializable } from '@/models/serializable';
import { Channel } from '@/models/channel';
import { Instrument } from '@/models/instrument';
import { Beats } from '@/models/types';
import { BuildingBlock } from '@/models/block';
import * as oly from '@/lib/olyger';

export const PointType = t.type({
  time: t.number,
  value: t.number,
});

export const AutomationType = t.type({
  context: t.union([t.literal('channel'), t.literal('instrument')]),
  contextId: t.string,
  attr: t.string,
  id: t.string,
  name: t.string,
  points: t.array(PointType),
});

export interface Point {
  time: oly.OlyRef<number>;
  value: oly.OlyRef<number>;
}

interface InternalPoint {
  time: oly.OlyRef<number>;
  value: oly.OlyRef<number>;
  controller: Audio.PointController;
}

export type IAutomation = t.TypeOf<typeof AutomationType>;

export type ClipContext = IAutomation['context'];
export type Automatable = Channel | Instrument;

export class AutomationClip implements Serializable<IAutomation>, BuildingBlock {
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
      name: 'Automation',
    });

    return ac;
  }

  // tslint:disable
  private readonly _points: oly.OlyArr<InternalPoint>;
  public readonly points: Point[];
  public readonly context: ClipContext;
  public readonly contextId: string;
  public readonly attr: string;
  public readonly id: string;
  public readonly name: oly.OlyRef<string>;
  public readonly control: Audio.Controller;
  // tslint:enable

  private readonly signal: Audio.Signal;

  constructor(signal: Audio.Signal, i: IAutomation) {
    this.context = i.context;
    this.contextId = i.contextId;
    this.attr = i.attr;
    this.id = i.id;
    this.name = oly.olyRef(i.name, 'Automation Name');

    this.signal = signal;
    this.control = new Audio.Controller(signal);

    this.points = this._points = oly.olyArr(i.points.map((p) => {
      const point: Point = {
        time: oly.olyRef(p.time),
        value: oly.olyRef(p.value),
      };

      return {
        ...point,
        controller: this.schedule(point),
      };
    }));

    const watch = (items: InternalPoint[]) => {
      items.forEach((point) => {
        point.time.onDidChange(({ subscriptions, newValue, oldValue }) => {
          subscriptions.push({
            execute: () => {
              point.controller.setTime(newValue);
              return {
                undo: () => {
                  point.controller.setTime(oldValue);
                },
              };
            },
          });
        });

        point.value.onDidChange(({ subscriptions, newValue, oldValue }) => {
          subscriptions.push({
            execute: () => {
              point.controller.setValue(newValue);
              return {
                undo: () => {
                  point.controller.setValue(oldValue);
                },
              };
            },
          });
        });
      });
    };

    watch(this._points);
    this._points.onDidAdd(({ items, subscriptions }) => {
      subscriptions.push({
        execute: () => {
          items.forEach((item) => {
            item.controller = this.schedule(item);
          });

          return {
            undo: () => {
              items.forEach((item) => {
                item.controller.remove();
              });
            },
          };
        },
      });

      watch(items);
    });

    this._points.onDidRemove(({ items, subscriptions }) => {
      subscriptions.push({
        execute: () => {
          const disposers = items.map((item) => item.controller.remove());

          return {
            undo: () => {
              disposers.forEach((disposer) => disposer.dispose());
            },
          };
        },
      });
    });
  }

  get duration() {
    if (!this.points.length) {
      return 0;
    }

    return this.points[this.points.length - 1].time.value;
  }

  get minValue() {
    return this.signal.minValue;
  }

  get maxValue() {
    return this.signal.maxValue;
  }

  public add(p: { time: number, value: number }) {
    this.points.push({
      time: oly.olyRef(p.time),
      value: oly.olyRef(p.value),
    });
  }

  public serialize() {
    return {
      context: this.context,
      contextId: this.contextId,
      attr: this.attr,
      id: this.id,
      name: this.name.value,
      points: this.points.map((point) => ({ time: point.time.value, value: point.value.value })),
    };
  }

  public dispose() {
    this.control.dispose();
  }

  private schedule(iPoint: Point) {
    return this.control.add(iPoint.time.value, iPoint.value.value);
  }
}
