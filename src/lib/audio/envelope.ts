import { Seconds, NormalRange, ContextTime } from '@/lib/audio/types';
import { createOfflineContext } from '@/lib/audio/offline';
import { getLogger } from '@/lib/log';
import { createSignal } from '@/lib/audio/signal';
import { getContext, withContext } from '@/lib/audio/global';
import { ObeoNode } from '@/lib/audio/node';
import { prim, Prim, Getter, getter } from '@/lib/reactor';

const logger = getLogger('envelope');

export interface ObeoEnvelope extends ObeoNode<AudioNode, undefined> {
  readonly value: Getter<number>;
  readonly sustain: Prim<number>;
  readonly release: Prim<number>;
  readonly attack: Prim<number>;
  readonly decay: Prim<number>;
  readonly attackCurve: Prim<InternalEnvelopeCurve>;
  readonly releaseCurve: Prim<InternalEnvelopeCurve>;
  readonly decayCurve: Prim<BasicEnvelopeCurve>;
  /**
   * triggerAttackRelease is shorthand for triggerAttack, then waiting
   * some duration, then triggerRelease.
   * @param duration The duration of the sustain.
   * @param time When the attack should be triggered.
   * @param velocity The velocity of the envelope.
   */
  triggerAttackRelease(duration: Seconds, time?: ContextTime, velocity?: NormalRange): void;
  /**
   * Cancels all scheduled envelope changes after the given time.
   */
  cancel(after?: ContextTime): void;
  /**
   * Get the scheduled value at the given time. This will
   * return the unconverted (raw) value.
   */
  getValueAtTime(when: ContextTime): NormalRange;
  /**
   * Trigger the attack/decay portion of the ADSR envelope.
   * @param  when When the attack should start.
   * @param velocity The velocity of the envelope scales the vales.
   */
  triggerAttack(when?: ContextTime, velocity?: NormalRange): void;
  /**
   * Triggers the release of the envelope.
   * @param  when When the release portion of the envelope should start.
   */
  triggerRelease(when?: ContextTime): void;
  /**
   * Render the envelope curve to an array of the given length.
   * Good for visualizing the envelope curve
   */
  asArray(length?: number): Promise<Float32Array>;
  dispose(): void;
}

export interface ObeoEnvelopeOptions {
  /**
   * When triggerAttack is called, the attack time is the amount of
   * time it takes for the envelope to reach it's maximum value.
   * ```
   *           /\
   *          /X \
   *         /XX  \
   *        /XXX   \
   *       /XXXX    \___________
   *      /XXXXX                \
   *     /XXXXXX                 \
   *    /XXXXXXX                  \
   *   /XXXXXXXX                   \
   * ```
   * @min 0
   * @max 2
   */
  attack: Seconds;

  /**
   * After the attack portion of the envelope, the value will fall
   * over the duration of the decay time to it's sustain value.
   * ```
   *           /\
   *          / X\
   *         /  XX\
   *        /   XXX\
   *       /    XXXX\___________
   *      /     XXXXX           \
   *     /      XXXXX            \
   *    /       XXXXX             \
   *   /        XXXXX              \
   * ```
   * @min 0
   * @max 2
   */
  decay: Seconds;

  /**
   * The sustain value is the value
   * which the envelope rests at after triggerAttack is
   * called, but before triggerRelease is invoked.
   * ```
   *           /\
   *          /  \
   *         /    \
   *        /      \
   *       /        \___________
   *      /          XXXXXXXXXXX\
   *     /           XXXXXXXXXXX \
   *    /            XXXXXXXXXXX  \
   *   /             XXXXXXXXXXX   \
   * ```
   */
  sustain: NormalRange;

  /**
   * After triggerRelease is called, the envelope's
   * value will fall to it's miminum value over the
   * duration of the release time.
   * ```
   *           /\
   *          /  \
   *         /    \
   *        /      \
   *       /        \___________
   *      /                    X\
   *     /                     XX\
   *    /                      XXX\
   *   /                       XXXX\
   * ```
   * @min 0
   * @max 5
   */
  release: Seconds;

  attackCurve: InternalEnvelopeCurve;
  releaseCurve: InternalEnvelopeCurve;
  decayCurve: BasicEnvelopeCurve;
}

/**
 * Do a bounds check and throw an `TimeRange` if the value is not within the bounds. Note that the
 * bounds are inclusive.
 *
 * @param minValue The minimum value.
 * @param maxValue The maximum vaulue.
 * @return A validation function.
 */
const timeRange = (minValue: number, maxValue?: number) => (value: number) => {
  if (value < minValue ) {
    throw RangeError(`Value (${value}) is lesser than min value (${minValue})`);
  }

  if (maxValue !== undefined && value > maxValue) {
    throw RangeError(`Value (${value}) is greater than max value (${maxValue})`);
  }
};

/**
 * Envelope is an [ADSR](https://en.wikipedia.org/wiki/Synthesizer#ADSR_envelope) envelope
 * generator. Envelope outputs a signal which can be connected to an AudioParam or Tone.Signal.
 * ```
 *           /\
 *          /  \
 *         /    \
 *        /      \
 *       /        \___________
 *      /                     \
 *     /                       \
 *    /                         \
 *   /                           \
 * ```
 */
export const createEnvelope = (options?: Partial<ObeoEnvelopeOptions>): ObeoEnvelope => {
  const attack = prim(options?.attack ?? 0.005, timeRange(0));
  const decay = prim(options?.decay ?? 0.1, timeRange(0));
  const sustain = prim(options?.sustain ?? 1, timeRange(0, 1));
  const release = prim(options?.release ?? 0.3, timeRange(0));
  const attackCurve = prim(options?.attackCurve ?? 'linear');
  const releaseCurve = prim(options?.releaseCurve ?? 'exponential');
  const decayCurve = prim(options?.decayCurve ?? 'exponential');
  const sig = createSignal({ name: 'EnvelopeSignal', value: 0 });
  const context = getContext();

  const triggerAttack = (time?: ContextTime, velocity: NormalRange = 1) => {

    time = time ?? context.now();
    let att = attack.value;

    // check if it's not a complete attack
    const currentValue = sig.offset.getValueAtTime(time);
    if (currentValue > 0) {
      // subtract the current value from the attack time
      const attackRate = 1 / att;
      const remainingDistance = 1 - currentValue;
      // the att is now the remaining time
      att = remainingDistance / attackRate;
    }

    logger.debug('triggerAttack', time, velocity, attack, currentValue, att);

    // att
    if (att < context.sampleTime) {
      sig.offset.cancelScheduledValues(time);
      // case where the att time is 0 should set instantly
      sig.offset.setValueAtTime(velocity, time);
    } else if (attackCurve.value === 'linear') {
      sig.offset.linearRampTo(velocity, att, time);
    } else if (attackCurve.value === 'exponential') {
      sig.offset.targetRampTo(velocity, att, time);
    } else {
      sig.offset.cancelAndHoldAtTime(time);
      let curve = attackCurve.value;
      // find the starting position in the curve
      for (let i = 1; i < curve.length; i++) {
        // the starting index is between the two values
        if (curve[i - 1] <= currentValue && currentValue <= curve[i]) {
          curve = attackCurve.value.slice(i);
          // the first index is the current value
          curve[0] = currentValue;
          break;
        }
      }
      sig.offset.setValueCurveAtTime(curve, time, att, velocity);
    }
    // decay
    if (decay.value && sustain.value < 1) {
      const decayValue = velocity * sustain.value;
      const decayStart = time + att;
      if (decayCurve.value === 'linear') {
        sig.offset.linearRampToValueAtTime(decayValue, decayStart + decay.value);
      } else {
        sig.offset.exponentialApproachValueAtTime(decayValue, decayStart, decay.value);
      }
    }
  };

  const triggerRelease = (when?: ContextTime) => {
    when = when ?? context.now();
    const currentValue = getValueAtTime(when);
    if (currentValue > 0) {
      if (release.value < context.sampleTime) {
        sig.offset.setValueAtTime(0, when);
      } else if (releaseCurve.value === 'linear') {
        sig.offset.linearRampTo(0, release.value, when);
      } else if (releaseCurve.value === 'exponential') {
        sig.offset.targetRampTo(0, release.value, when);
      } else {
        sig.offset.cancelAndHoldAtTime(when);
        sig.offset.setValueCurveAtTime(releaseCurve.value, when, release.value, currentValue);
      }
    }
  };

  const triggerAttackRelease = (duration: Seconds, time?: ContextTime, velocity: NormalRange = 1) => {
    time = time ?? context.now();
    triggerAttack(time, velocity);
    triggerRelease(time + duration);
  };

  const getValueAtTime = (time: ContextTime): NormalRange => {
    return sig.offset.getValueAtTime(time);
  };

  const cancel = (after?: ContextTime) => {
    sig.offset.cancelScheduledValues(after ?? context.now());
  };

  const asArray = async (length = 1024): Promise<Float32Array> => {
    const duration = length / context.sampleRate;
    const offline = createOfflineContext({
      length,
      numberOfChannels: 1,
      sampleRate: context.sampleRate,
    });

    return withContext(offline, async () => {
      // normalize the ADSR for the given duration with 20% sustain time
      const attackPortion = attack.value + decay.value;
      const envelopeDuration = attackPortion + release.value;
      const sustainTime = envelopeDuration * 0.1;
      const totalDuration = envelopeDuration + sustainTime;

      const cloneOptions: ObeoEnvelopeOptions = {
        attack: duration * attack.value / totalDuration,
        decay: duration * decay.value / totalDuration,
        release: duration * release.value / totalDuration,
        sustain: sustain.value,
        attackCurve: attackCurve.value,
        decayCurve: decayCurve.value,
        releaseCurve: releaseCurve.value,
      };

      const clone = createEnvelope(cloneOptions);
      clone.toDestination();
      clone.triggerAttackRelease(duration * (attackPortion + sustainTime) / totalDuration, 0);

      const buffer = await offline.render();
      return buffer.getChannelData(0);
    });
  };

  const dispose = () => {
    sig.disconnect();
  };

  return {
    ...sig,
    value: getter(() => getValueAtTime(context.now())),
    asArray,
    dispose,
    triggerAttackRelease,
    cancel,
    getValueAtTime,
    triggerAttack,
    triggerRelease,
    sustain,
    release,
    attack,
    decay,
    attackCurve,
    releaseCurve,
    decayCurve,
  };
};


type BasicEnvelopeCurve = 'linear' | 'exponential';
type InternalEnvelopeCurve = BasicEnvelopeCurve | number[];
