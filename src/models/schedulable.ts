import * as t from '@/lib/io';
import Tone from 'tone';
import * as Audio from '@/lib/audio';
import { Beat } from '@/lib/audio/types';
import { computed, Ref, ref, watch } from '@vue/composition-api';
import { Context } from '@/lib/audio';
import { Sample } from '@/models/sample';
import { Pattern } from '@/models/pattern';
import { AutomationClip } from '@/models/automation';
import { Instrument } from '@/models/instrument/instrument';
import { allKeys } from '@/utils';
import { BuildingBlock } from '@/models/block';
import { Disposer } from '@/lib/std';
import * as oly from '@/olyger';
import { getLogger } from '@/lib/log';

const logger = getLogger('schedulable', { level: 'debug' });

export const watchOlyArray = <T extends ScheduledElement<any, any, any>>(arr: oly.OlyArr<T>) => {
  arr.onDidRemove(({ items, subscriptions }) => {
    logger.debug(`onDidRemove ${items.length} elements`);
    subscriptions.push({
      execute: () => {
        logger.debug(`Removing ${items.length} elements`);
        const disposers = items.map((item) => item.remove());
        return {
          undo: () => {
            logger.debug(`Undoing remove of ${items.length} elements`);
            disposers.forEach((disposer) => disposer.dispose());
          },
        };
      },
    });
  });

  arr.onDidAdd(({ items, subscriptions }) => {
    logger.debug(`onDidAdd ${items.length} elements`);

    subscriptions.push({
      execute: () => {
        logger.debug(`Adding ${items.length} elements`);
        const disposers = items.map((item) => item.add());
        return {
          undo: () => {
            logger.debug(`Undoing add of ${items.length} elements`);
            disposers.forEach((disposer) => disposer.dispose());
          },
        };
      },
    });
  });

  return arr;
};

export const createType = <T extends string, M extends t.Mixed>(
  type: T, options: M,
): SerializationType<T, M> => t.intersection([
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
  options,
]);

type SerializationType<T extends string, M extends t.Mixed> = t.IntersectionC<[
  t.TypeC<{
    row: t.NumberC;
    time: t.NumberC;
    duration: t.NumberC;
    id: t.StringC;
    type: t.LiteralC<T>;
  }>,
  t.PartialC<{
    offset: t.NumberC;
  }>,
  M,
]>;

interface SchedulableOpts<Element, Type extends string, Options extends t.Mixed> {
  component: string;
  showBorder: boolean;
  type: Type;
  offsettable?: boolean;
  options: Options;
  add: (
    transport: Audio.Transport,
    params: ScheduledElement<Element, Type, Options>,
    element: Element,
  ) => Audio.TransportEventController | undefined;
}

const wrap = (initial: number, onSet: (value: number) => void) => {
  const reference = oly.olyRef(initial);
  watch(() => reference.value, (value) => {
    onSet(value);
  }, { lazy: true });
  return reference;
};

export type SchedulablePrototype<
  Element, Type extends string, Options extends t.Mixed
> = () => ScheduledElement<Element, Type, Options>;

export type ScheduledElement<Element, Type extends string, Options extends t.Mixed> = Readonly<{
  component: string;
  element: Element;
  type: Type;
  offsettable: boolean;
  duration: Ref<number>;
  time: Ref<number>;
  offset: Ref<number>;
  options: t.TypeOf<Options>;
  row: Ref<number>;
  endBeat: Readonly<Ref<number>>;
  showBorder: boolean;
  name?: Readonly<Ref<string>>;
  slice: (timeToSlice: number) => ScheduledElement<Element, Type, Options> | undefined;
  remove: () => Disposer;
  add: () => Disposer;
  serialize: () => t.TypeOf<SerializationType<Type, Options>>;
  copy: SchedulablePrototype<Element, Type, Options>;
}>;

interface Basics {
  duration: number;
  time: number;
  row: number;
  offset?: number;
}

const createSchedulable = <
  T extends BuildingBlock,
  M extends string,
  Options extends t.Mixed,
>(o: SchedulableOpts<T, M, Options>) => {
  const create = (
    opts: Basics,
    idk: T,
    transport: Audio.Transport,
    options: t.TypeOf<Options>,
  ): ScheduledElement<T, M, Options> => {
    const info = {  ...opts };

    const duration = wrap(info.duration, (value) => {
      if (controller) { controller.setDuration(value); }
    });

    const time = wrap(info.time, (value) => {
      if (controller) { controller.setStartTime(value); }
    });

    const offset = wrap(info.offset ?? 0, (value) => {
      if (controller) { controller.setOffset(value); }
    });

    const row = oly.olyRef(info.row);

    const copy = () => {
      return create(
        { duration: duration.value, time: time.value, row: row.value, offset: offset.value },
        idk,
        transport,
        options,
      );
    };

    const remove = () => {
      const disposer = controller?.remove();
      return {
        dispose: () => {
          disposer?.dispose();
        },
      };
    };

    const add = () => {
      const local = controller = o.add(transport, params, idk);
      return {
        dispose: () => {
          local?.remove();
        },
      };
    };


    const params: ScheduledElement<T, M, Options> = {
      name: computed(() => idk.name),
      component: o.component,
      type: o.type,
      offsettable: o.offsettable ?? false,
      element: idk,
      duration,
      time,
      offset,
      row,
      copy,
      options,
      slice: (timeToSlice: Beat) => {
        if (timeToSlice <= time.value || timeToSlice >= time.value + duration.value) {
          return;
        }

        const oldDuration = duration.value;
        const newElement = copy();
        duration.value = timeToSlice - time.value;

        if (o.offsettable) {
          newElement.offset.value = duration.value;
        } else {
          newElement.time.value += duration.value;
          newElement.duration.value = oldDuration - duration.value;
        }

        return newElement;
      },
      add,
      remove,
      endBeat: computed(() => {
        return time.value + duration.value;
      }),
      serialize: () => {
        return {
          row: row.value,
          time: time.value,
          duration: duration.value,
          offset: offset.value,
          type: o.type,
          id: idk.id,
          ...options,
        };
      },
      showBorder: o.showBorder,
    } as const;

    let controller: Audio.TransportEventController | undefined;

    return params;
  };

  return {
    create: (opts: Basics, element: T, options: t.TypeOf<Options>) => (transport: Audio.Transport) => ({
      copy: () => create(opts, element, transport, options),
    }),
    type: createType(o.type, o.options),
  };
};

export type UnscheduledPrototype<T = any, K extends string = any, Options extends t.Mixed = any> = (
  transport: Audio.Transport,
) => ScheduledElement<T, K, Options>;

export const { create: createSamplePrototype, type: ScheduledSampleType } = createSchedulable({
  component: 'sample-element',
  type: 'sample',
  showBorder: true,
  offsettable: true,
  options: t.type({}),
  add: (transport, params, sample: Sample) => {
    if (!sample.player.node) {
      return;
    }

    const instance = sample.player.node.createInstance();
    let controller: { stop: (seconds: Audio.ContextTime) => void } | null = null;
    return transport.schedule({
      time: params.time.value,
      duration: params.duration.value,
      offset: 0,
      onStart: ({ seconds }) => {
        controller = instance.start({
          startTime: seconds,
          offset: Context.beatsToSeconds(params.offset.value),
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

export type ScheduledSample = ReturnType<ReturnType<ReturnType<typeof createSamplePrototype>>['copy']>;

export const { create: createPatternPrototype, type: ScheduledPatternType } = createSchedulable({
  component: 'pattern-element',
  type: 'pattern',
  offsettable: true,
  showBorder: true,
  options: t.type({}),
  add: (transport, params, pattern: Pattern) => {
    return transport.embed(pattern.transport, params.time.value, params.duration.value);
  },
});

export type ScheduledPattern = ReturnType<ReturnType<ReturnType<typeof createPatternPrototype>>['copy']>;

export const { create: createAutomationPrototype, type: ScheduledAutomationType } = createSchedulable({
  component: 'automation-clip-element',
  type: 'automation',
  offsettable: true,
  showBorder: true,
  options: t.type({}),
  add: (transport, params, clip: AutomationClip) => {
    return clip.control.sync(transport, params.time.value, params.duration.value);
  },
});

export type ScheduledAutomation = ReturnType<ReturnType<ReturnType<typeof createAutomationPrototype>>['copy']>;

export const { create: createNotePrototype, type: ScheduledNoteType } = createSchedulable({
  component: 'note',
  type: 'note',
  offsettable: false,
  showBorder: false,
  options: t.type({ velocity: t.number }),
  add: (transport, params, instrument: Instrument<any, any>) => {
    return transport.schedule({
      onStart: ({ seconds }) => {
        logger.debug('onStart Note -> ' + seconds);
        const value = allKeys[params.row.value].value;
        const duration = new Tone.Ticks(params.duration.value * Audio.Context.PPQ).toSeconds();
        instrument.triggerAttackRelease(value, duration, seconds, params.options.velocity);
      },
      time: params.time.value,
      duration: 0, // FIXME We shouldn't have to set a duration. This is explained more in the Transport class file.
      offset: 0,
    });
  },
});

export type ScheduledNote = ReturnType<ReturnType<ReturnType<typeof createNotePrototype>>['copy']>;
