import { Ticks } from '@/lib/audio/types';
import { Disposer } from '@/lib/std';
import { Getter, getter } from '@/lib/reactor';

export interface ObeoTimeline<T extends TimelineEvent> extends Disposer {
  /**
   * Add an event.
   *
   * @param event The event to add.
   */
  add(event: T): void;

  /**
   * Remove an event from the timeline.
   * @param  event The event object to remove from the list.
   * @returns Whether the remove was successful.
   */
  remove(event: T): boolean;

  /**
   * Iterate over everything in the array between the startTime and endTime.
   * The range is inclusive of the startTime, but exclusive of the endTime.
   * range = [startTime, endTime).
   * @param startTime The time to check if items are before
   * @param endTime The end of the test interval.
   * @param  callback The callback to invoke with every item
   */
  forEachBetween(startTime: Ticks, endTime: Ticks, callback: (event: T) => void): void;

  /**
   * Iterate over all of the events at the given tick value.
   *
   * @param ticks The tick to search for events.
   * @param callback The callback to to invoke for all of the events.
   */
  forEachAtTime(ticks: Ticks, callback: (event: T) => void): void;

  /**
   * Iterate over everything in the array at or before the given time.
   * @param  time The time to check if items are before
   * @param  callback The callback to invoke with every item
   */
  forEachBefore(time: number, callback: (event: T) => void): void;

  /**
   * Iterate over everything in the array after the given time.
   * @param  time The time to check if items are before
   * @param  callback The callback to invoke with every item
   */
  forEachAfter(time: number, callback: (event: T) => void): void;

  /**
   * Iterate over every event in the timeline.
   *
   * @param cb The callback to invoke at every event.
   */
  forEach(cb: (event: T, i: number) => void): void;

  /**
   * Get the nearest event whose time is less than or equal to the given time.
   * @param  value  The time to query.
   */
  get(value: number, key?: (event: T) => number): T | undefined;

  /**
   * Get the event before the event at the given time.
   * @param  value  The time to query.
   */
  getBefore(value: number, key?: (event: T) => number): T | undefined;

  /**
   * Get the event which is scheduled after the given time.
   * @param  value  The time to query.
   */
  getAfter(value: number, key?: (event: T) => number): T | undefined;

  /**
   * Returns the previous event if there is one. null otherwise
   * @param  event The event to find the previous one of
   * @return The event right before the given event
   */
  previousEvent(event: T): T | undefined;

  /**
   * Cancel events at and after the given time
   * @param  after  The time to query.
   */
  cancel(after: number): void;

  /**
   * Does a binary search on the timeline array and returns information describing where the tick
   * value occurs.
   *
   * @param tick The tick.
   * @return The result. Either the time was was a hit, it was between two of the events, it was
   * before all of the
   * events or it was after all of the events.
   */
  search(tick: Ticks, key?: (event: T) => number): TimelineSearchResult;

  /**
   * Get the event at the given index.
   *
   * @param i The index.
   */
  getAtIndex(i: number): T;

  /**
   * Get the number of events in the timeline.
   */
  size(): number;
}

export type TimelineSearchResult =
  { type: 'hit', firstOccurrenceIndex: number, lastOccurrenceIndex: number } |
  { type: 'before' } |
  { type: 'between', indexA: number, indexB: number } |
  { type: 'after' };

export interface TimelineEvent {
  time: Ticks;
  offset?: Ticks;
}

/**
 * A timeline for scheduling and maintaining state
 * along a timeline. All events must have a "time" property.
 * Internally, events are stored in time order for fast
 * retrieval.
 */
export const createTimeline = <T extends TimelineEvent>(): ObeoTimeline<T> => {
  const timeline: T[] = [];

  const add = (event: T) => {
    const result = search(getStart(event));
    const index =
      result.type === 'before' ? 0 :
      result.type === 'after' ? timeline.length :
      result.type === 'between' ? result.indexB :
      result.lastOccurrenceIndex + 1;

    // This inserts the event at the given index
    timeline.splice(index, 0, event);
  };

  const remove = (event: T): boolean => {
    const index = timeline.indexOf(event);
    if (index !== -1) {
      timeline.splice(index, 1);
      return true;
    }

    return false;
  };

  const forEachBetween = (startTime: Ticks, endTime: Ticks, callback: (event: T) => void) => {
    const lower = search(startTime);
    const upper = search(endTime);

    const lowerIndex =
      lower.type === 'before' ? 0 :
      lower.type === 'after' ? timeline.length :
      lower.type === 'between' ? lower.indexB :
      lower.firstOccurrenceIndex;

    const upperIndex =
      upper.type === 'before' ? 0 :
      upper.type === 'after' ? timeline.length :
      upper.type === 'between' ? upper.indexB :
      upper.firstOccurrenceIndex;

    timeline.slice(lowerIndex, upperIndex).forEach(callback);
  };

  const forEachAtTime = (ticks: Ticks, callback: (event: T) => void) => {
    // The index of the first event with the given time
    const result = search(ticks);
    if (result.type !== 'hit') {
      return;
    }

    timeline.slice(
      result.firstOccurrenceIndex, result.lastOccurrenceIndex + 1,
    ).forEach(callback);
  };

  const forEach = (cb: (event: T, index: number) => void) => {
    timeline.slice().forEach(cb);
  };

  const forEachBefore = (time: number, callback: (event: T) => void) => {
    // iterate over the items in reverse so that removing an item doesn't break things
    const result = search(time);
    const getIndex = (): number => {
      switch (result.type) {
        case 'after':
          return timeline.length;
        case 'before':
          return 0;
        case 'between':
          return result.indexA + 1;
        case 'hit':
          return result.lastOccurrenceIndex + 1;
      }
    };


    timeline.slice(0, getIndex()).forEach((callback));
  };

  const forEachAfter = (time: number, callback: (event: T) => void) => {
    // iterate over the items in reverse so that removing an item doesn't break things
    const result = search(time);
    const getIndex = (): number => {
      switch (result.type) {
        case 'after':
          return timeline.length;
        case 'before':
          return 0;
        case 'between':
          return result.indexB;
        case 'hit':
          return result.lastOccurrenceIndex + 1;
      }
    };

    const lowerBound = getIndex();
    timeline.slice(lowerBound).forEach(callback);
  };

  const search = (tick: Ticks, key?: (event: T) => number): TimelineSearchResult => {
    key = key ?? getStart;

    if (timeline.length === 0) {
      return { type: 'before' };
    }

    let beginning = 0;
    const len = timeline.length;
    let end = len;
    if (len > 0 && key(timeline[len - 1]) < tick) {
      return { type: 'after' };
    }

    while (beginning < end) {
      // calculate the midpoint for roughly equal partition
      const midPoint = Math.floor(beginning + (end - beginning) / 2);
      const event = timeline[midPoint];
      const nextEvent = timeline[midPoint + 1];
      if (key(event) === tick) {
        let firstOccurrenceIndex = midPoint;
        for (let i = midPoint; i >= 0; i--) {
          if (key(timeline[i]) !== tick) {
            break;
          }
          firstOccurrenceIndex = i;
        }

        let lastOccurrenceIndex = midPoint;
        for (let i = midPoint; i < timeline.length; i++) {
          if (key(timeline[i]) !== tick) {
            break;
          }
          lastOccurrenceIndex = i;
        }

        return { type: 'hit', firstOccurrenceIndex, lastOccurrenceIndex };
      } else if (key(event) < tick && key(nextEvent) > tick) {
        return { type: 'between', indexA: midPoint, indexB: midPoint + 1 };
      } else if (key(event) > tick) {
        // search lower
        end = midPoint;
      } else {
        // search upper
        beginning = midPoint + 1;
      }
    }

    return { type: 'before' };
  };

  const getStart = (event: T) => {
    return event.time + (event.offset ?? 0);
  };


  const get = (value: number, key?: (event: T) => number): T | undefined => {
    const result = search(value, key);
    switch (result.type) {
      case 'before':
        return;
      case 'between':
        return timeline[result.indexA];
      case 'hit':
        return timeline[result.lastOccurrenceIndex];
      case 'after':
        // This could also return undefined
        return timeline[timeline.length - 1];
    }
  };

  const getAfter = (value: number, key?: (event: T) => number): T | undefined => {
    const result = search(value, key);
    switch (result.type) {
      case 'before':
        // This could return undefined
        return timeline[0];
      case 'between':
        return timeline[result.indexB];
      case 'hit':
        // This could also return undefined
        return timeline[result.lastOccurrenceIndex + 1];
      case 'after':
        return;
    }
  };

  const getBefore = (value: number, key?: (event: T) => number): T | undefined => {
    const result = search(value, key);
    switch (result.type) {
      case 'before':
        return;
      case 'between':
        return timeline[result.indexA];
      case 'hit':
          // This could return undefined
        return timeline[result.lastOccurrenceIndex - 1];
      case 'after':
        // This could also return undefined
        return timeline[timeline.length - 1];
    }
  };

  const cancel = (after: number) => {
    const getIndex = (): number | undefined => {
      const result = search(after);
      switch (result.type) {
        case 'before':
          return 0;
        case 'between':
          return result.indexB;
        case 'hit':
          return result.firstOccurrenceIndex;
        case 'after':
          return;
      }
    };

    const index = getIndex();
    if (index === undefined) {
      return;
    }

    timeline.splice(index, timeline.length - index);
  };

  const previousEvent = (event: T): T | undefined => {
    const index = timeline.indexOf(event);
    // This could be undefined
    return timeline[index - 1];
  };

  const size = () => {
    return timeline.length;
  };

  const dispose = () => {
    timeline.splice(0, timeline.length);
  };

  const getAtIndex = (i: number) => {
    return timeline[i];
  };

  return {
    add,
    remove,
    forEachBetween,
    forEachAtTime,
    get,
    getAfter,
    getBefore,
    cancel,
    previousEvent,
    dispose,
    search,
    size,
    getAtIndex,
    forEach,
    forEachBefore,
    forEachAfter,
  };
};
