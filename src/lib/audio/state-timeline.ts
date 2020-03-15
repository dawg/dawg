import { createTimeline, TimelineEvent } from '@/lib/audio/timeline';
import { Seconds } from '@/lib/audio/types';

export type PlaybackState = 'stopped' | 'started' | 'stopped';

export interface StateTimelineEvent extends TimelineEvent {
  state: PlaybackState;
}

export interface StateTimelineOption {
  initial: PlaybackState;
}

export const createStateTimeline = (options?: Partial<StateTimelineOption>) => {
  const timeline = createTimeline<{ time: Seconds, state: PlaybackState }>();
  const initial: PlaybackState = options?.initial ?? 'stopped';

  /**
   * Returns the scheduled state scheduled before or at
   * the given time.
   * @param  time  The time to query.
   * @return  The name of the state input in setStateAtTime.
   */
  const getValueAtTime = (time: Seconds): PlaybackState => {
    const event = timeline.get(time);
    if (event) {
      return event.state;
    } else {
      return initial;
    }
  };

  /**
   * Add a state to the timeline.
   * @param  state The name of the state to set.
   * @param  time  The time to query.
   * @param options Any additional options that are needed in the timeline.
   */
  const setStateAtTime = (state: PlaybackState, time: Seconds) => {
    timeline.add({
      state,
      time,
    });
  };

  /**
   * Return the event before the time with the given state
   * @param  state The state to look for
   * @param  time  When to check before
   * @return  The event with the given state before the time
   */
  const getLastState = (state: PlaybackState, time: number): StateTimelineEvent | undefined => {
    const result = timeline.search(time);
    const getIndex = (): number => {
      switch (result.type) {
        case 'before':
          return -1;
        case 'hit':
          return result.firstOccurrenceIndex - 1;
        case 'between':
          return result.indexB;
        case 'after':
          return timeline.size() - 1;
      }
    };

    const index = getIndex();
    for (let i = index; i >= 0; i--) {
      const event = timeline.getAtIndex(i);
      if (event.state === state) {
        return event;
      }
    }
  };

  /**
   * Return the event after the time with the given state
   * @param  state The state to look for
   * @param  time  When to check from
   * @return  The event with the given state after the time
   */
  const getNextState = (state: PlaybackState, time: number): StateTimelineEvent | undefined => {
    const result = timeline.search(time);
    const getIndex = (): number => {
      switch (result.type) {
        case 'before':
          return 0;
        case 'hit':
          return result.lastOccurrenceIndex + 1;
        case 'between':
          return result.indexA;
        case 'after':
          return timeline.size();
      }
    };

    const index = getIndex();
    if (index !== -1) {
      for (let i = index; i < timeline.size(); i++) {
        const event = timeline.getAtIndex(i);
        if (event.state === state) {
          return event;
        }
      }
    }
  };

  setStateAtTime(initial, 0);

  return {
    setStateAtTime,
    getNextState,
    getLastState,
    getValueAtTime,
  };
};
