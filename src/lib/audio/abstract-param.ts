import Tone from 'tone';
import { Seconds, ContextTime } from '@/lib/audio/types';
import { context } from '@/lib/audio/online';
import { assert } from '@/lib/audio/util';
import { defineProperties } from '@/lib/std';
import { getLogger } from '@/lib/log';

const logger = getLogger('envelope');

export interface ObeoParam extends AudioParam {
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
  ): ObeoParam;
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

export type ObeoParamExtension<T, V> = (events: Tone.Timeline<AutomationEvent<T>>, param: ObeoParam) => {
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
): ObeoParam & V => {
  const { toUnit = (v) => v, fromUnit = (v) => v } = opts;
  const events = new Tone.Timeline<AutomationEvent<T>>(1000);
  const initialValue = opts.value ?? param.defaultValue;
  const minOutput = 1e-7;
  param.value = opts.value ?? initialValue;

  const exponentialRampToValueAtTime = (value: number, endTime: ContextTime) => {
    logger.debug(`${opts.name ?? ''}:exponentialRampToValueAtTime`, value, endTime);
    value = fromUnit(value);
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
    setValueAtTime(toUnit(startingValue), startTime);
    const segTime = duration / (values.length - 1);
    for (let i = 1; i < values.length; i++) {
      const numericValue = fromUnit(values[i] * scaling);
      linearRampToValueAtTime(toUnit(numericValue), startTime + i * segTime);
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
    if (before === null) {
      value = initialValue;
    } else if (before.type === 'setTargetAtTime' && (after === null || after.type === 'setValueAtTime')) {
      const previous = events.getBefore(before.time);
      let previousVal;
      if (previous === null) {
        previousVal = initialValue;
      } else {
        previousVal = previous.value;
      }
      if (before.type === 'setTargetAtTime') {
        value = exponentialApproach(before.time, previousVal, before.value, before.constant, computedTime);
      }
    } else if (after === null) {
      value = before.value;
    } else if (after.type === 'linearRampToValueAtTime' || after.type === 'exponentialRampToValueAtTime') {
      let beforeValue = before.value;
      if (before.type === 'setTargetAtTime') {
        const previous = events.getBefore(before.time);
        if (previous === null) {
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
    let currentVal = getValueAtTime(time);
    cancelAndHoldAtTime(time);
    if (fromUnit(currentVal) === 0) {
      currentVal = toUnit(minOutput);
    }
    setValueAtTime(currentVal, time);
  };

  const exponentialRampTo = (value: number, rampTime: Seconds, startTime?: ContextTime) => {
    logger.debug(`${opts.name ?? ''}:exponentialRampTo`, value, rampTime, startTime);
    startTime = startTime ?? context.now();
    setRampPoint(startTime);
    exponentialRampToValueAtTime(value, startTime + rampTime);
  };

  const linearRampTo = (value: number, rampTime: Seconds, startTime?: ContextTime) => {
    logger.debug(`${opts.name ?? ''}:linearRampTo`, value, rampTime, startTime);
    startTime = startTime ?? context.now();
    setRampPoint(startTime);
    linearRampToValueAtTime(value, startTime + rampTime);
  };

  const targetRampTo = (value: number, rampTime: Seconds, startTime?: ContextTime) => {
    logger.debug(`${opts.name ?? ''}:targetRampTo`, value, rampTime, startTime);
    startTime = startTime ?? context.now();
    setRampPoint(startTime);
    exponentialApproachValueAtTime(value, startTime, rampTime);
  };

  const cancelScheduledValues = (time: ContextTime) => {
    assert(isFinite(time), `Invalid argument to cancelScheduledValues: ${JSON.stringify(time)}`);
    events.cancel(time);
    param.cancelScheduledValues(time);
    return extended;
  };

  const cancelAndHoldAtTime = (time: ContextTime) => {
    const computedTime = time;
    const valueAtTime = fromUnit(getValueAtTime(computedTime));
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
        linearRampToValueAtTime(toUnit(valueAtTime), computedTime);
      } else if (after.type === 'exponentialRampToValueAtTime') {
        exponentialRampToValueAtTime(toUnit(valueAtTime), computedTime);
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
    setTargetAtTime(value, time, timeConstant);
    // at 90% start a linear ramp to the final value
    cancelAndHoldAtTime(time + rampTime * 0.9);
    linearRampToValueAtTime(value, time + rampTime);
  };

  const extended: ObeoParam = defineProperties({
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
  }, {
    value: {
      get() {
        logger.debug(`${opts.name ?? ''}:value:get`);
        const now = context.now();
        return getValueAtTime(now);
      },
      set(value: number) {
        logger.debug(`${opts.name ?? ''}:value:set`, value);
        cancelScheduledValues(context.now());
        setValueAtTime(value, context.now());
      },
    },
  });

  const { extension, addEventInformation } = extend(events, extended);

  const add = (event: AutomationEvent<{}>) => {
    const params = addEventInformation(event);
    Object.assign(event, params);
    events.add(event);
  };

  return {
    ...extended,

    // This must go at the end to overwrite any functions
    ...extension,
  };
};
