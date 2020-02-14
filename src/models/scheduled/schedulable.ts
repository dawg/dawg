import * as t from '@/lib/io';
import * as Audio from '@/lib/audio';
import { StrictEventEmitter } from '@/lib/events';
import { Beat } from '@/lib/audio/types';
import * as history from '@/core/project/history';
import { computed, Ref } from '@vue/composition-api';
import { Context } from '@/lib/audio/context';
import { Sample } from '@/models/sample';
import { literal } from '@/lib/std';
import { Pattern } from '@/models/pattern';
import { AutomationClip } from '@/models/automation';


export const SchedulableType = t.intersection([
  t.type({
    row: t.number,
    time: t.number,
    duration: t.number,
  }),
  t.partial({
    offset: t.number,
  }),
]);



export const createType = <T extends string>(type: T): SerializationType<T> => t.intersection([
  t.type({
    row: t.number,
    time: t.number,
    duration: t.number,
    id: t.string,
    type: t.literal<T>(type),
  }),
  t.partial({
    offset: t.number,
  }),
]);

type SerializationType<T extends string> = t.IntersectionC<[
  t.TypeC<{
    row: t.NumberC;
    time: t.NumberC;
    duration: t.NumberC;
    id: t.StringC;
    type: t.LiteralC<T>;
  }>,
  t.PartialC<{
    offset: t.NumberC;
  }>
]>;

export type ISchedulable = t.TypeOf<typeof SchedulableType>;

interface ISchedulableCreate<T, M extends string> {
  component: string;
  type: M;
  offsettable?: boolean;
  add: (
    transport: Audio.Transport, params: SchedulableTemp<T, M>, idk: T,
  ) => Audio.TransportEventController | undefined;
}

const wrap = <T, K extends keyof T>(o: T, k: K, onSet?: (value: T[K]) => void) => {
  return computed({
    get: () => o[k],
    set: (value: T[K]) => {
      if (onSet) { onSet(value); }
      o[k] = value;
    },
  });
};

interface IID {
  id: string;
}

type SchedulableTemp<T, M extends string> = Readonly<{
  component: string;
  copy: () => SchedulableTemp<T, M>;
  duration: Ref<number>;
  time: Ref<number>;
  offset: Ref<number | undefined>;
  row: Ref<number>;
  slice: (timeToSlice: number) => SchedulableTemp<T, M> | undefined;
  dispose: () => void;
  remove: () => void;
  removeNoHistory: () => void;
  serialize: () => t.TypeOf<SerializationType<M>>;
}>;

const createSchedulable = <T extends IID, M extends string>(o: ISchedulableCreate<T, M>) => {
  const create = (opts: ISchedulable, idk: T, transport: Audio.Transport) => {
    const info = {  ...opts };

    const duration = wrap(info, 'duration', (value) => {
      if (controller) { controller.setDuration(value); }
    });

    const time = wrap(info, 'time', (value) => {
      if (controller) { controller.setStartTime(value); }
    });

    const offset = wrap(info, 'offset', (value) => {
      if (controller) { controller.setStartTime(value || 0); }
    });

    const row = wrap(info, 'row');

    const copy = () => create(info, idk, transport);

    const removeNoHistory = () => {
      if (controller) {
        controller.remove();
        // TODO
        // this.emit('remove');
      }
    };

    const remove = () => {
      history.execute({
        execute: () => {
          removeNoHistory();
        },
        undo: () => {
          if (controller) {
            controller.undoRemove();
            // TODO
            // this.emit('undoRemove');
          }
        },

      });
    };

    const dispose = () => {
      removeNoHistory();
    };

    const params: SchedulableTemp<T, M> = {
      component: o.component,
      duration,
      time,
      offset,
      row,
      copy,
      slice: (timeToSlice: Beat) => {
        if (timeToSlice <= time.value || timeToSlice >= time.value + duration.value) {
          return;
        }

        const newDuration = timeToSlice - time.value;
        const otherElementDuration = duration.value - newDuration;

        const newElement = copy();
        newElement.duration.value = otherElementDuration;
        duration.value = newDuration;

        if (o.offsettable) {
          newElement.offset.value = newDuration;
        } else {
          newElement.time.value += newDuration;
        }

        return newElement;
      },
      remove,
      removeNoHistory,
      dispose,
      serialize: () => {
        return {
          row: row.value,
          time: time.value,
          duration: duration.value,
          offset: offset.value,
          type: o.type,
          id: idk.id,
        };
      },
    } as const;

    const controller = o.add(transport, params, idk);

    return params;
  };

  return {
    create: (opts: ISchedulable, idk: T) => (transport: Audio.Transport) => create(opts, idk, transport),
    type: createType(o.type),
  };
};

const { create: createSamplePrototype } = createSchedulable({
  component: 'sample-element',
  type: 'sample',
  offsettable: true,
  add: (transport, params, sample: Sample) => {
    if (!sample.player) {
      return;
    }

    const instance = sample.player.createInstance();
    let controller: { stop: (seconds: Audio.ContextTime) => void } | null = null;
    return transport.schedule({
      time: params.time.value,
      duration: params.duration.value,
      offset: 0,
      onStart: ({ seconds }) => {
        controller = instance.start({
          startTime: seconds,
          offset: params.offset.value || 0,
          duration: Context.beatsToSeconds(params.duration.value),
        });
      },
      onMidStart: ({ seconds, secondsOffset }) => {
        controller = instance.start({
          startTime: seconds,
          offset: secondsOffset,
          duration: Context.beatsToSeconds(params.duration.value),
        });
      },
      onEnd: ({ seconds }) => {
        // `controller` should never be null but we need to satisfy TypeScript
        // If, for some reason, it is null, then we don't really care about calling stop
        if (controller) {
          controller.stop(seconds);
        }
      },
    });
  },
});

const samplePrototype = createSamplePrototype({ row: 0, time: 0, duration: 1 }, new Sample('' as any, '' as any));


const createPatternPrototype = createSchedulable({
  component: 'pattern-element',
  type: 'pattern',
  offsettable: true,
  add: (transport, params, pattern: Pattern) => {
    return transport.embed(pattern.transport, params.time.value, params.duration.value);
  },
});

const createAutomationPrototype = createSchedulable({
  component: 'automation-clip-element',
  type: 'automation',
  offsettable: true,
  add: (transport, params, clip: AutomationClip) => {
    return clip.control.sync(transport, params.time.value, params.duration.value);
  },
});

interface Opts {
  disableOffset?: boolean;
}

export abstract class Schedulable extends StrictEventEmitter<{ remove: [], undoRemove: [] }> {
  /**
   * The component name to mount in the `Sequencer`.
   */
  public readonly abstract component: string;
  public readonly disableOffset: boolean;

  /**
   * Refers to row where the element is placed.
   * For notes, these are numbered 0 -> 87 and start from the higher frequencies.
   */
  public row: number;

  protected readonly abstract sliceMode: 'duplicate' | 'offset';

  // tslint:disable-next-line:variable-name
  private _time: number;

  /**
   * Private duration in beats.
   */
  private beats: number;
  // tslint:disable-next-line:variable-name
  private _offset: number;
  private controller?: Audio.TransportEventController;

  constructor(i: ISchedulable, opts: Opts = {}) {
    super();
    this.row = i.row;
    this._offset = i.offset || 0;
    // this.offset = i.offset;
    this._time = i.time;
    this.beats = i.duration;
    this.duration = i.duration;
    this.disableOffset = opts.disableOffset || false;
  }

  get offset() {
    return this._offset;
  }

  set offset(offset: number) {
    this._offset = offset;
    if (this.controller) {
      this.controller.setOffset(offset);
    }
  }

  /**
   * Duration in beats.
   */
  get duration() {
    return this.beats;
  }

  set duration(value: number) {
    this.beats = value;
    if (this.controller) {
      this.controller.setDuration(value);
    }
  }

  /**
   * Time in beats.
   */
  get time() {
    return this._time;
  }

  set time(time: Beat) {
    this._time = time;
    if (this.controller) {
      this.controller.setStartTime(time);
    }
  }

  get endBeat() {
    return this.time + this.duration;
  }

  public schedule(transport: Audio.Transport) {
    this.controller = this.add(transport);
  }

  public slice(time: Beat) {
    if (time <= this.time || time >= this.time + this.duration) {
      return;
    }

    const newDuration = time - this.time;
    const otherElementDuration = this.duration - newDuration;

    const newElement = this.copy();
    newElement.duration = otherElementDuration;
    this.duration = newDuration;

    if (this.sliceMode === 'duplicate') {
      newElement.time += newDuration;
    } else if (this.sliceMode === 'offset') {
      newElement.offset = newDuration;
    }

    return newElement;
  }

  public removeNoHistory() {
    if (this.controller) {
      this.controller.remove();
      this.emit('remove');
    }
  }

  public remove() {
    history.execute({
      execute: () => {
        this.removeNoHistory();
      },
      undo: () => {
        if (this.controller) {
          this.controller.undoRemove();
          this.emit('undoRemove');
        }
      },

    });
  }

  public dispose() {
    this.removeNoHistory();
    super.dispose();
  }

  public abstract copy(): Schedulable;

  /**
   * Add yourself to the transport. Return null if it's not possible.
   *
   * @param transport The target transport.
   */
  protected abstract add(transport: Audio.Transport): Audio.TransportEventController | undefined;
}
