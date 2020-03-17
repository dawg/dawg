import { ObeoParamOptions } from '@/lib/audio/param';
import {
  createAbstractParam,
  AutomationEvent,
  exponentialApproach,
  ObeoAbstractParam,
  exponentialInterpolate,
} from '@/lib/audio/abstract-param';
import { ContextTime, Ticks, Seconds } from '@/lib/audio/types';
import { getContext } from '@/lib/audio/global';

interface Extension {
  getTicksUntilEvent(event: TickAutomationEvent | undefined, time: number): Ticks;
  getTicksAtTime(time: ContextTime): Ticks;
  getDurationOfTicks(ticks: Ticks, time: ContextTime): Seconds;
  getTimeOfTick(tick: Ticks): Seconds;
  ticksToTime(ticks: Ticks, when: ContextTime): Seconds;
  timeToTicks(duration: Seconds, when: ContextTime): Ticks;
}

export type ObeoTickParam = ObeoAbstractParam & Extension;

export type ObeoTickSignalOptions = ObeoParamOptions;

type TickAutomationEvent = AutomationEvent<{ ticks: number }>;

/**
 * TickSignal extends Tone.Signal, but adds the capability
 * to calculate the number of elapsed ticks. exponential and target curves
 * are approximated with multiple linear ramps.
 *
 * Thank you Bruno Dias, H. Sofia Pinto, and David M. Matos,
 * for your [WAC paper](https://smartech.gatech.edu/bitstream/handle/1853/54588/WAC2016-49.pdf)
 * describing integrating timing functions for tempo calculations.
 *
 * Why approximate? I asked this question too and I'm pretty sure the answer is because it's
 * difficult to do lots of the calculations when the events are exponential. Linear stuff is
 * easy :)
 */
export const createTickParam = (param: AudioParam, options: Partial<ObeoTickSignalOptions> = {}): ObeoTickParam => {
  const context = getContext();
  const { toUnit = (v) => v, fromUnit = (v) => v } = options;

  // This isn't exactly the cleanest in the world but it works well enough
  // Why did I do this?
  // There are obviously basic params but how can one extend their functionality?
  // Tone uses classes but I tend to avoid them plus their solution isn't 100% ideal either
  // since it involves lots of casting.
  // I honestly think Tone's solution is better in this situation since classes seem ideal
  // with their protected member variables but oh well...
  // Also, we explicitly set the generics since TS can't infer in this situation.
  return createAbstractParam<{ ticks: number }, Extension>(
    param,
    (events, api) => {
      const setTargetAtTime = (value: number, time: ContextTime, constant: number) => {
        // approximate it with multiple linear ramps
        time = time ?? context.now();
        api.setRampPoint(time);
        const computedValue = fromUnit(value);

        // start from previously scheduled value
        const prevEvent = events.get(time) as TickAutomationEvent;
        const segments = Math.round(Math.max(1 / constant, 1));
        for (let i = 0; i <= segments; i++) {
          const segTime = constant * i + time;
          const rampVal = exponentialApproach(prevEvent.time, prevEvent.value, computedValue, constant, segTime);
          api.linearRampToValueAtTime(toUnit(rampVal), segTime);
        }
      };

      const exponentialRampToValueAtTime = (value: number, time: ContextTime) => {
        // approximate it with multiple linear ramps
        time = time ?? context.now();
        const computedVal = fromUnit(value);

        // start from previously scheduled value
        const prevEvent = events.get(time) as TickAutomationEvent;
        // approx 10 segments per second
        const segments = Math.round(Math.max((time - prevEvent.time) * 10, 1));
        const segmentDur = ((time - prevEvent.time) / segments);
        for (let i = 0; i <= segments; i++) {
          const segTime = segmentDur * i + prevEvent.time;
          const rampVal = exponentialInterpolate(prevEvent.time, prevEvent.value, time, computedVal, segTime);
          api.linearRampToValueAtTime(toUnit(rampVal), segTime);
        }
      };

      /**
       * Returns the tick value at the time. Takes into account
       * any automation curves scheduled on the signal.
       * @param  event The time to get the tick count at
       * @return The number of ticks which have elapsed at the time given any automations.
       */
      const getTicksUntilEvent = (event: TickAutomationEvent | undefined, time: number): Ticks => {
        if (!event) {
          event = {
            ticks: 0,
            time: 0,
            type: 'setValueAtTime',
            value: 0,
          };
        }

        // tslint:disable-next-line:no-console
        // TODO I don't this this is needed in my implementation
        // else if (isUndef(event.ticks)) {
        //   const previousEvent = events.previousEvent(event);
        //   event.ticks = getTicksUntilEvent(previousEvent, event.time);
        // }

        const val0 = fromUnit(api.getValueAtTime(event.time));
        let val1 = fromUnit(api.getValueAtTime(time));
        // if it's right on the line, take the previous value
        const onTheLineEvent = events.get(time);
        if (onTheLineEvent && onTheLineEvent.time === time && onTheLineEvent.type === 'setValueAtTime') {
          val1 = fromUnit(api.getValueAtTime(time - context.sampleTime));
        }

        return 0.5 * (time - event.time) * (val0 + val1) + event.ticks;
      };

      /**
       * Returns the tick value at the time. Takes into account
       * any automation curves scheduled on the signal.
       * @param  time The time to get the tick count at
       * @return The number of ticks which have elapsed at the time given any automations.
       */
      const getTicksAtTime = (time: ContextTime): Ticks => {
        const event = events.get(time);
        return Math.max(getTicksUntilEvent(event, time), 0);
      };

      /**
       * Return the elapsed time of the number of ticks from the given time
       * @param ticks The number of ticks to calculate
       * @param  time The time to get the next tick from
       * @return The duration of the number of ticks from the given time in seconds
       */
      const getDurationOfTicks = (ticks: Ticks, time: ContextTime): Seconds => {
        const currentTick = getTicksAtTime(time);
        return getTimeOfTick(currentTick + ticks) - time;
      };

      /**
       * Given a tick, returns the time that tick occurs at.
       * @return The time that the tick occurs.
       */
      const getTimeOfTick = (tick: Ticks): Seconds => {
        const before = events.get(tick, (e) => e.ticks);
        const after = events.getAfter(tick, (e) => e.ticks);
        if (before && before.ticks === tick) {
          return before.time;
        } else if (before && after &&
          after.type === 'linearRampToValueAtTime' &&
          before.value !== after.value) {
          const val0 = fromUnit(api.getValueAtTime(before.time));
          const val1 = fromUnit(api.getValueAtTime(after.time));
          const delta = (val1 - val0) / (after.time - before.time);
          const k = Math.sqrt(Math.pow(val0, 2) - 2 * delta * (before.ticks - tick));
          const sol1 = (-val0 + k) / delta;
          const sol2 = (-val0 - k) / delta;
          return (sol1 > 0 ? sol1 : sol2) + before.time;
        } else if (before) {
          if (before.value === 0) {
            return Infinity;
          } else {
            return before.time + (tick - before.ticks) / before.value;
          }
        } else {
          return tick / param.defaultValue;
        }
      };

      /**
       * Convert some number of ticks their the duration in seconds accounting
       * for any automation curves starting at the given time.
       * @param  ticks The number of ticks to convert to seconds.
       * @param  when  When along the automation timeline to convert the ticks.
       * @return The duration in seconds of the ticks.
       */
      const ticksToTime = (ticks: Ticks, when: ContextTime): Seconds => {
        return getDurationOfTicks(ticks, when);
      };

      /**
       * The inverse of [[ticksToTime]]. Convert a duration in
       * seconds to the corresponding number of ticks accounting for any
       * automation curves starting at the given time.
       * @param  duration The time interval to convert to ticks.
       * @param  when When along the automation timeline to convert the ticks.
       * @return The duration in ticks.
       */
      const timeToTicks = (duration: Seconds, when: ContextTime): Ticks => {
        const computedTime = when ?? context.now();
        const computedDuration = duration ?? context.now();
        const startTicks = getTicksAtTime(computedTime);
        const endTicks = getTicksAtTime(computedTime + computedDuration);
        return endTicks - startTicks;
      };

      return {
        addEventInformation: (event) => {
          const previousEvent = events.previousEvent(event);
          const ticksUntilTime = getTicksUntilEvent(previousEvent, event.time);
          return {
            ticks: Math.max(0, ticksUntilTime),
          };
        },
        extension: {
          // Overwriting for linear approximations
          setTargetAtTime,
          exponentialRampToValueAtTime,

          // New functionality
          getTicksUntilEvent,
          getTicksAtTime,
          getDurationOfTicks,
          getTimeOfTick,
          ticksToTime,
          timeToTicks,
        },
      };
    },
    options,
  );
};
