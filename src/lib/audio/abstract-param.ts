import { Seconds, ContextTime } from '@/lib/audio/types';
import { assert } from '@/lib/audio/util';
import { defineProperties } from '@/lib/std';
import { getLogger } from '@/lib/log';
import { getContext } from '@/lib/audio/global';
import { createTimeline, ObeoTimeline } from '@/lib/audio/timeline';

const logger = getLogger('envelope', { level: 'info', style: false });

export interface ObeoAbstractParam extends AudioParam {
  name: 'param';
  param: AudioParam;
  exponentialRampTo(value: number, rampTime: Seconds, startTime?: ContextTime): void;
  linearRampTo(value: number, rampTime: Seconds, startTime?: ContextTime): void;
  targetRampTo(value: number, rampTime: Seconds, startTime?: ContextTime): void;
  exponentialApproachValueAtTime(value: number, time: ContextTime, rampTime: Seconds): void;
  setRampPoint(time: ContextTime): void;
  getValueAtTime(time: ContextTime): number;
  setValueCurveAtTime(
    values: number[] | Float32Array,
    startTime: ContextTime,
    duration: Seconds,
    scaling?: number,
  ): ObeoAbstractParam;
  dispose(): void;
}

export type ObeoConversion = (value: number) => number;

export type ObeoAutomationType =
  'linearRampToValueAtTime' |
  'exponentialRampToValueAtTime' |
  'setValueAtTime' |
  'setTargetAtTime' |
  'cancelScheduledValues';

export type ObeoTargetAutomationEvent<T> = {
  type: 'setTargetAtTime';
  time: number;
  value: number;
  constant: number;
} & T;

export type ObeoNormalAutomationEvent<T> = {
  type: Exclude<ObeoAutomationType, 'setTargetAtTime'>;
  time: number;
  value: number;
} & T;

/**
 * The events on the automation
 */
export type AutomationEvent<T> = ObeoTargetAutomationEvent<T> | ObeoNormalAutomationEvent<T>;

export interface ObeoAbstractParamOptions {
  name: string;
  value: number;
  toUnit: ObeoConversion;
  fromUnit: ObeoConversion;
}

export type ObeoParamExtension<T, V> = (events: ObeoTimeline<AutomationEvent<T>>, param: ObeoAbstractParam) => {
  addEventInformation: (event: AutomationEvent<T>) => T;
  extension: V;
};

// -------------------------------------
  // 	AUTOMATION CURVE CALCULATIONS
  // 	MIT License, copyright (c) 2014 Jordan Santell
  // -------------------------------------

// Calculates the the value along the curve produced by setTargetAtTime
export const exponentialApproach = (t0: number, v0: number, v1: number, timeConstant: number, t: number) => {
  return v1 + (v0 - v1) * Math.exp(-(t - t0) / timeConstant);
};

// Calculates the the value along the curve produced by linearRampToValueAtTime
export const linearInterpolate = (t0: number, v0: number, t1: number, v1: number, t: number) => {
  return v0 + (v1 - v0) * ((t - t0) / (t1 - t0));
};

// Calculates the the value along the curve produced by exponentialRampToValueAtTime
export const exponentialInterpolate = (t0: number, v0: number, t1: number, v1: number, t: number) => {
  return v0 * Math.pow(v1 / v0, (t - t0) / (t1 - t0));
};

// TODO min/max values??
export const createAbstractParam = <T, V>(
  param: AudioParam,
  extend: ObeoParamExtension<T, V>,
  opts: Partial<ObeoAbstractParamOptions> = {},
): ObeoAbstractParam & V => {
  const context = getContext();
  const { toUnit = (v) => v, fromUnit = (v) => v } = opts;
  const events = createTimeline<AutomationEvent<T>>();
  // const events = new Tone.Timeline<AutomationEvent<T>>(1000);
  const initialValue = opts.value ?? param.defaultValue;
  const minOutput = 1e-7;

  const exponentialRampToValueAtTime = (value: number, endTime: ContextTime) => {
    logger.debug(`${opts.name ?? ''}:exponentialRampToValueAtTime`, value, endTime);
    value = fromUnit(value);
    value = Math.max(minOutput, value);
    add({ time: endTime, type: 'exponentialRampToValueAtTime', value });
    param.exponentialRampToValueAtTime(value, endTime);
    return extended;
  };

  const linearRampToValueAtTime = (value: number, endTime: ContextTime) => {
    logger.debug(`${opts.name ?? ''}:linearRampToValueAtTime`, value, endTime);
    value = fromUnit(value);
    add({ time: endTime, type: 'linearRampToValueAtTime', value });
    param.linearRampToValueAtTime(value, endTime);
    return extended;
  };

  const setTargetAtTime = (target: number, startTime: ContextTime, timeConstant: number) => {
    logger.debug(`${opts.name ?? ''}:setTargetAtTime`, target, startTime, timeConstant);
    target = fromUnit(target);
    add({ time: startTime, type: 'setTargetAtTime', value: target, constant: timeConstant });
    param.setTargetAtTime(target, startTime, timeConstant);
    return extended;
  };

  const setValueAtTime = (value: number, startTime: ContextTime) => {
    logger.debug(`${opts.name ?? ''}:setValueAtTime`, value, startTime);
    value = fromUnit(value);
    add({ time: startTime, type: 'setValueAtTime', value });
    param.setValueAtTime(value, startTime);
    return extended;
  };

  const setValueCurveAtTime = (
    values: number[] | Float32Array,
    startTime: ContextTime,
    duration: Seconds,
    scaling = 1,
  ) => {
    logger.debug(`${opts.name ?? ''}:setValueCurveAtTime`, values, startTime, duration, scaling);
    const startingValue = fromUnit(values[0] * scaling);
    api.setValueAtTime(toUnit(startingValue), startTime);
    const segTime = duration / (values.length - 1);
    for (let i = 1; i < values.length; i++) {
      const numericValue = fromUnit(values[i] * scaling);
      api.linearRampToValueAtTime(toUnit(numericValue), startTime + i * segTime);
    }
    return extended;
  };

  const getValueAtTime = (time: ContextTime) => {
    logger.debug(`${opts.name ?? ''}:getValueAtTime`, time);
    const computedTime = Math.max(time, 0);
    const after = events.getAfter(computedTime);
    const before = events.get(computedTime);

    let value = initialValue;
    // if it was set by
    if (!before) {
      value = initialValue;
    } else if (before.type === 'setTargetAtTime' && (!after || after.type === 'setValueAtTime')) {
      const previous = events.getBefore(before.time);
      let previousVal;
      if (!previous) {
        previousVal = initialValue;
      } else {
        previousVal = previous.value;
      }
      if (before.type === 'setTargetAtTime') {
        value = exponentialApproach(before.time, previousVal, before.value, before.constant, computedTime);
      }
    } else if (!after) {
      value = before.value;
    } else if (after.type === 'linearRampToValueAtTime' || after.type === 'exponentialRampToValueAtTime') {
      let beforeValue = before.value;
      if (before.type === 'setTargetAtTime') {
        const previous = events.getBefore(before.time);
        if (!previous) {
          beforeValue = initialValue;
        } else {
          beforeValue = previous.value;
        }
      }

      if (after.type === 'linearRampToValueAtTime') {
        value = linearInterpolate(before.time, beforeValue, after.time, after.value, computedTime);
      } else {
        value = exponentialInterpolate(before.time, beforeValue, after.time, after.value, computedTime);
      }
    } else {
      value = before.value;
    }

    return toUnit(value);
  };

  const setRampPoint = (time: ContextTime) => {
    let currentVal = api.getValueAtTime(time);
    api.cancelAndHoldAtTime(time);
    if (fromUnit(currentVal) === 0) {
      currentVal = toUnit(minOutput);
    }
    api.setValueAtTime(currentVal, time);
  };

  const exponentialRampTo = (value: number, rampTime: Seconds, startTime?: ContextTime) => {
    logger.debug(`${opts.name ?? ''}:exponentialRampTo`, value, rampTime, startTime);
    startTime = startTime ?? context.now();
    api.setRampPoint(startTime);
    api.exponentialRampToValueAtTime(value, startTime + rampTime);
  };

  const linearRampTo = (value: number, rampTime: Seconds, startTime?: ContextTime) => {
    logger.debug(`${opts.name ?? ''}:linearRampTo`, value, rampTime, startTime);
    startTime = startTime ?? context.now();
    api.setRampPoint(startTime);
    api.linearRampToValueAtTime(value, startTime + rampTime);
  };

  const targetRampTo = (value: number, rampTime: Seconds, startTime?: ContextTime) => {
    logger.debug(`${opts.name ?? ''}:targetRampTo`, value, rampTime, startTime);
    startTime = startTime ?? context.now();
    api.setRampPoint(startTime);
    api.exponentialApproachValueAtTime(value, startTime, rampTime);
  };

  const cancelScheduledValues = (time: ContextTime) => {
    assert(isFinite(time), `Invalid argument to cancelScheduledValues: ${JSON.stringify(time)}`);
    events.cancel(time);
    param.cancelScheduledValues(time);
    return extended;
  };

  const cancelAndHoldAtTime = (time: ContextTime) => {
    const computedTime = time;
    const valueAtTime = fromUnit(api.getValueAtTime(computedTime));
    // remove the schedule events
    assert(isFinite(computedTime), `Invalid argument to cancelAndHoldAtTime: ${JSON.stringify(time)}`);

    // if there is an event at the given computedTime
    // and that even is not a "set"
    const before = events.get(computedTime);
    const after = events.getAfter(computedTime);
    if (before && before.time === computedTime) {
      // remove everything after
      if (after) {
        param.cancelScheduledValues(after.time);
        events.cancel(after.time);
      } else {
        param.cancelAndHoldAtTime(computedTime);
        events.cancel(computedTime + context.sampleTime);
      }
    } else if (after) {
      param.cancelScheduledValues(after.time);
      // cancel the next event(s)
      events.cancel(after.time);
      if (after.type === 'linearRampToValueAtTime') {
        api.linearRampToValueAtTime(toUnit(valueAtTime), computedTime);
      } else if (after.type === 'exponentialRampToValueAtTime') {
        api.exponentialRampToValueAtTime(toUnit(valueAtTime), computedTime);
      }
    }

    // set the value at the given time
    add({
      time: computedTime,
      type: 'setValueAtTime',
      value: valueAtTime,
    });
    param.setValueAtTime(valueAtTime, computedTime);
    return extended;
  };

  const exponentialApproachValueAtTime = (value: number, time: ContextTime, rampTime: Seconds) => {
    logger.debug(`${opts.name ?? ''}:exponentialApproachValueAtTime`, value, time, rampTime);
    const timeConstant = Math.log(rampTime + 1) / Math.log(200);
    api.setTargetAtTime(value, time, timeConstant);
    // at 90% start a linear ramp to the final value
    api.cancelAndHoldAtTime(time + rampTime * 0.9);
    api.linearRampToValueAtTime(value, time + rampTime);
  };

  const dispose = () => {
    events.dispose();
  };

  const extended: ObeoAbstractParam = defineProperties({
    // AudioParam
    // TODO properties ??
    automationRate: param.automationRate,
    defaultValue: param.defaultValue,
    maxValue: param.maxValue,
    minValue: param.minValue,
    // until here
    cancelAndHoldAtTime,
    cancelScheduledValues,
    exponentialRampToValueAtTime,
    linearRampToValueAtTime,
    setTargetAtTime,
    setValueAtTime,
    setValueCurveAtTime,

    // Custom
    name: 'param',
    param,
    setRampPoint,
    exponentialRampTo,
    linearRampTo,
    targetRampTo,
    getValueAtTime,
    exponentialApproachValueAtTime,
    dispose,
  }, {
    value: {
      get() {
        logger.debug(`${opts.name ?? ''}:value:get`);
        const now = context.now();
        return api.getValueAtTime(now);
      },
      set(value: number) {
        logger.debug(`${opts.name ?? ''}:value:set`, value);
        cancelScheduledValues(context.now());
        setValueAtTime(value, context.now());
      },
    },
  });

  // We must define add here before we initialize (which calls a function which calls `add`)
  const add = (event: AutomationEvent<T>) => {
    // Not sure if this is the best but it's necessary for the tick param which calls
    // `getTicksUntilEvent` during the `addEventInformation`
    events.add(event);
    const params = addEventInformation(event);
    Object.assign(event, params);
  };

  // We *must* also call this before initializing
  const { extension, addEventInformation } = extend(events, extended);

  // Ok finally do the initialization down here
  // It is important that we set the at time 0
  if (opts.value !== undefined) {
    extended.setValueAtTime(opts.value ?? initialValue, 0);
  }

  // We assign `extension` -> `extended` to overwrite any functions
  // We also use `assign` so that the properties defined above are not removed
  const api = Object.assign(extended, extension);

  // TODO names of all these things
  return api;
};
