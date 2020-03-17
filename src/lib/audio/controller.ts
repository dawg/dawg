import { Ticks, Beat } from '@/lib/audio/types';
import { Transport } from '@/lib/audio/transport';
import { Disposer, literal } from '@/lib/std';
import { createAbstractParam } from '@/lib/audio/abstract-param';
import { getContext } from '@/lib/audio/global';
import { ObeoScheduledSourceNode } from '@/lib/audio/scheduled-source-node';

interface ObeoAutomation extends ObeoScheduledSourceNode {
  readonly offset: any; // ObeoParam
}

// TODO

export interface PointController {
  setValue: (value: number) => void;
  setTime: (time: number) => void;
  remove: () => Disposer;
}

export const createAutomation = () => {
  const context = getContext();
  const source = context.createConstantSource();
  const param = createAbstractParam(
    source.offset,
    (events) => {
      const add = (time: Beat, value: number): PointController => {
        const event = {
          time: context.beatsToTicks(time),
          value,
          type: literal('linearRampToValueAtTime'),
        };

        events.add(event);

        return {
          setValue: (newValue: number) => {
            event.value = newValue;
          },
          setTime: (newTime: number) => {
            event.time = newTime;
          },
          remove: () => {
            events.remove(event);
            return {
              dispose: () => {
                events.add(event);
              },
            };
          },
        };
      };

      const sync = (transport: Transport, time: Ticks, duration: Ticks) => {
        let lastValue: number | undefined;

        const onEndAndStart = ({ seconds }: { seconds: number }) => {
          const val = param.getValueAtTime(transport.seconds);
          lastValue = val;
          param.cancelScheduledValues(seconds);
          param.setValueAtTime(val, seconds);
        };

        const onTick = ({ seconds, ticks }: { seconds: number, ticks: number }) => {
          const val = param.getValueAtTime(context.ticksToSeconds(ticks));
          if (lastValue !== val) {
            lastValue = val;
            // approximate curves with linear ramps
            param.linearRampToValueAtTime(val, seconds);
            param.value = val;
          }
        };

        return transport.schedule({
          time,
          duration,
          onTick,
          onStart: onEndAndStart,
          onEnd: onEndAndStart,
          offset: 0,
          // FIXME when you refactor this file this should be set
          row: 0,
        });
      };

      return {
        addEventInformation: () => ({}),
        extension: {
          add,
          sync,
        },
      };
    },
  );


  return param;
};
