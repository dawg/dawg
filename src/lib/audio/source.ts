// import { Volume } from "../component/channel/Volume";
// import "../core/context/Destination";
// import "../core/clock/Transport";
// import { Param } from "../core/context/Param";
// import { OutputNode, ToneAudioNode, ToneAudioNodeOptions } from "../core/context/ToneAudioNode";
// import { Decibels, Seconds, Time } from "../core/type/Units";
// import { defaultArg } from "../core/util/Defaults";
// import { noOp, readOnly } from "../core/util/Interface";
// import { BasicPlaybackState, StateTimeline, StateTimelineEvent } from "../core/util/StateTimeline";
// import { isDefined, isUndef } from "../core/util/TypeCheck";
// import { assert, assertContextRunning } from "../core/util/Debug";
// import { GT } from "../core/util/Math";

import Tone, { TransportState } from 'tone';
import { Decibels, ContextTime, Seconds } from '@/lib/audio/types';
import { createVolume } from '@/lib/audio/volume';
import { Context, context } from '@/lib/audio/context';

export interface SourceOptions {
  // TODO not used
  volume: Decibels;
  mute: boolean;
  onStop: () => void;
  start(time: ContextTime, offset?: Seconds, duration?: Seconds): void;
  stop(time: ContextTime): void;
  restart(time: Seconds, offset?: Seconds, duration?: Seconds): void;
}

export const createSource = (options: SourceOptions) => {
  // this._volume = this.output = new Volume({
  //   context: this.context,
  //   mute: options.mute,
  //   volume: options.volumfe,
  // });
  // this.volume = this._volume.volume;
  const volume = createVolume();

  // TODO
  const onStop = options.onStop;

  /**
   * Keep track of the scheduled state.
   */
  const state: Tone.TimelineState<{
    time: ContextTime;
    state: TransportState;
    duration?: Seconds;
    offset?: Seconds;
    /**
     * Either the buffer is explicitly scheduled to end using the stop method,
     * or it's implicitly ended when the buffer is over.
     */
    implicitEnd?: boolean;
  }> = new Tone.TimelineState('stopped');

  /**
   * Start the source at the specified time. If no time is given,
   * stareft the source now.
   * @param  time When the source should be started.
   * @example
   * import { Oscillator } from "tone";
   * const source = new Oscillator().toDestination();
   * source.start("+0.5"); // starts the source 0.5 seconds from now
   */
  const start = (time?: ContextTime, offset?: Seconds, duration?: Seconds) => {
    let computedTime = time ?? Context.now();
    computedTime = Math.max(computedTime, context.currentTime);
    // if it's started, stop it and restart it
    if (state.getValueAtTime(computedTime) === 'started') {
      state.cancel(computedTime);
      state.setStateAtTime('started', computedTime);
      restart(computedTime, offset, duration);
    } else {
      state.setStateAtTime('started', computedTime);
      options.start(computedTime, offset, duration);

      // TODO
      // assertContextRunning(this.context);
    }
  };

  /**
   * Restart the source.
   */
  const restart = (time?: ContextTime, offset?: Seconds, duration?: Seconds) => {
    time = time ?? Context.now();
    if (state.getValueAtTime(time) === 'started') {
      state.cancel(time);
      options.restart(time, offset, duration);
    }
  };

  /**
   * Stop the source at the specified time. If no time is given,
   * stop the source now.
   * @param time When the source should be stopped.
   */
  const stop = (time?: ContextTime) => {
    const computedTime = Math.max(time ?? Context.now(), context.currentTime);
    if (
      state.getValueAtTime(computedTime) === 'started' ||
      state.getNextState('started', computedTime) !== undefined
    ) {
      options.stop(computedTime);
      state.cancel(computedTime);
      state.setStateAtTime('stopped', computedTime);
    }
  };

  return Object.assign({ start, stop, restart }, volume);
};
