import Tone from 'tone';
import { Seconds, ContextTime } from '@/lib/audio/types';
import { context } from '@/lib/audio/online';
import { assert } from '@/lib/audio/util';

export type Conversion = (value: number) => number;

type AutomationType =
  'linearRampToValueAtTime' |
  'exponentialRampToValueAtTime' |
  'setValueAtTime' |
  'setTargetAtTime' |
  'cancelScheduledValues';

interface TargetAutomationEvent {
  type: 'setTargetAtTime';
  time: number;
  value: number;
  constant: number;
}

interface NormalAutomationEvent {
  type: Exclude<AutomationType, 'setTargetAtTime'>;
  time: number;
  value: number;
}
/**
 * The events on the automation
 */
export type AutomationEvent = NormalAutomationEvent | TargetAutomationEvent;

// TODO min/max values??
export const createParam = (
  param: AudioParam,
  opts: { value?: number, toUnit?: Conversion, fromUnit?: Conversion } = {},
) => {
  const { toUnit = (v) => v, fromUnit = (v) => v } = opts;
  const events = new Tone.Timeline<AutomationEvent>(1000);
  const initialValue = param.defaultValue;
  const minOutput = 1e-7;
  param.value = opts.value ?? initialValue;

  const savedExponentialRampToValueAtTime = param.exponentialRampToValueAtTime.bind(param);
  const savedLinearRampToValueAtTime = param.linearRampToValueAtTime.bind(param);
  const savedSetTargetAtTime = param.setTargetAtTime.bind(param);
  const savedSetValueAtTime = param.setValueAtTime.bind(param);

  const exponentialRampToValueAtTime = (value: number, endTime: number): AudioParam => {
    value = fromUnit(value);
    events.add({ time: endTime, type: 'exponentialRampToValueAtTime', value });
    savedExponentialRampToValueAtTime(value, endTime);
    return extended;
  };

  const linearRampToValueAtTime = (value: number, endTime: number): AudioParam => {
    value = fromUnit(value);
    events.add({ time: endTime, type: 'linearRampToValueAtTime', value });
    savedLinearRampToValueAtTime(value, endTime);
    return extended;
  };

  const setTargetAtTime = (target: number, startTime: number, timeConstant: number): AudioParam => {
    target = fromUnit(target);
    events.add({ time: startTime, type: 'setTargetAtTime', value: target, constant: timeConstant });
    savedSetTargetAtTime(target, startTime, timeConstant);
    return extended;
  };

  const setValueAtTime = (value: number, startTime: number): AudioParam => {
    value = fromUnit(value);
    events.add({ time: startTime, type: 'setValueAtTime', value });
    savedSetValueAtTime(value, startTime);
    return extended;
  };

  const setValueCurveAtTime = (
    values: number[] | Float32Array,
    startTime: ContextTime,
    duration: Seconds,
    scaling = 1,
  ): AudioParam => {
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
    startTime = startTime ?? context.now();
    setRampPoint(startTime);
    exponentialRampToValueAtTime(value, startTime + rampTime);
  };

  const linearRampTo = (value: number, rampTime: Seconds, startTime?: ContextTime) => {
    startTime = startTime ?? context.now();
    setRampPoint(startTime);
    linearRampToValueAtTime(value, startTime + rampTime);
  };

  const targetRampTo = (value: number, rampTime: Seconds, startTime?: ContextTime) => {
    startTime = startTime ?? context.now();
    setRampPoint(startTime);
    exponentialApproachValueAtTime(value, startTime, rampTime);
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
    events.add({
      time: computedTime,
      type: 'setValueAtTime',
      value: valueAtTime,
    });
    param.setValueAtTime(valueAtTime, computedTime);
    return extended;
  };

  const exponentialApproachValueAtTime = (value: number, time: ContextTime, rampTime: Seconds) => {
    const timeConstant = Math.log(rampTime + 1) / Math.log(200);
    setTargetAtTime(value, time, timeConstant);
    // at 90% start a linear ramp to the final value
    cancelAndHoldAtTime(time + rampTime * 0.9);
    linearRampToValueAtTime(value, time + rampTime);
  };

  // -------------------------------------
  // 	AUTOMATION CURVE CALCULATIONS
  // 	MIT License, copyright (c) 2014 Jordan Santell
  // -------------------------------------

  // Calculates the the value along the curve produced by setTargetAtTime
  const exponentialApproach = (t0: number, v0: number, v1: number, timeConstant: number, t: number) => {
    return v1 + (v0 - v1) * Math.exp(-(t - t0) / timeConstant);
  };

  // Calculates the the value along the curve produced by linearRampToValueAtTime
  const linearInterpolate = (t0: number, v0: number, t1: number, v1: number, t: number) => {
    return v0 + (v1 - v0) * ((t - t0) / (t1 - t0));
  };

  // Calculates the the value along the curve produced by exponentialRampToValueAtTime
  const exponentialInterpolate = (t0: number, v0: number, t1: number, v1: number, t: number) => {
    return v0 * Math.pow(v1 / v0, (t - t0) / (t1 - t0));
  };

  const extended = Object.assign(param, {
    exponentialRampToValueAtTime,
    linearRampToValueAtTime,
    setTargetAtTime,
    setValueAtTime,
    setValueCurveAtTime,
    exponentialRampTo,
    linearRampTo,
    targetRampTo,
    getValueAtTime,
    exponentialApproachValueAtTime,
    cancelAndHoldAtTime,
  });

  return extended;
};
