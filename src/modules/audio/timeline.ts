import { Ticks } from '@/modules/audio/types';
import { StrictEventEmitter } from '@/modules/audio/events';

/**
 *  @class A Timeline class for scheduling and maintaining state
 *         along a timeline. All events must have a "time" property.
 *         Internally, events are stored in time order for fast
 *         retrieval.
 */
export class Timeline<T extends { time: Ticks; }> extends StrictEventEmitter<{ add: [T], remove: [T] }> {
  protected timeline: T[] = [];

  public add(event: T) {
    const result = this.search(event.time);
    const index =
      result.type === 'before' ? 0 :
      result.type === 'after' ? this.timeline.length :
      result.type === 'between' ? result.indexB :
      result.lastOccurrenceIndex + 1;

    // This inserts the event at the given index
    this.timeline.splice(index, 0, event);

    this.emit('add', event);
  }

  /**
   *  Remove an event from the timeline.
   *  @param  event The event object to remove from the list.
   *  @returns this
   */
  public remove(event: T) {
    const index = this.timeline.indexOf(event);
    if (index !== -1) {
      this.emit('remove', this.timeline[index]);
      this.timeline.splice(index, 1);
    }
  }

  /**
   *  Iterate over everything in the array between the startTime and endTime.
   *  The range is inclusive of the startTime, but exclusive of the endTime.
   *  range = [startTime, endTime).
   *  @param startTime The time to check if items are before
   *  @param endTime The end of the test interval.
   *  @param  callback The callback to invoke with every item
   */
  public forEachBetween(startTime: Ticks, endTime: Ticks, callback: (event: T) => void) {
    const lower = this.search(startTime);
    const upper = this.search(endTime);

    const lowerIndex =
      lower.type === 'before' ? 0 :
      lower.type === 'after' ? this.timeline.length :
      lower.type === 'between' ? lower.indexB :
      lower.firstOccurrenceIndex;

    const upperIndex =
      upper.type === 'before' ? 0 :
      upper.type === 'after' ? this.timeline.length :
      upper.type === 'between' ? upper.indexA :
      upper.firstOccurrenceIndex - 1;

    for (let i = lowerIndex; i < upperIndex; i++) {
      callback(this.timeline[i]);
    }
  }

  public forEachAtTime(ticks: Ticks, callback: (event: T) => void) {
    // The index of the first event with the given time
    const result = this.search(ticks);
    if (result.type !== 'hit') {
      return;
    }

    this.timeline.slice(
      result.firstOccurrenceIndex, result.lastOccurrenceIndex + 1,
    ).forEach(callback);
  }

  /**
   *  Does a binary search on the timeline array and returns information describing where the tick value occurs.
   *
   *  @param tick The tick.
   *  @return The result. Either the time was was a hit, it was between two of the events, it was before all of the
   *  events or it was after all of the events.
   */
  protected search(tick: Ticks): (
    { type: 'hit', firstOccurrenceIndex: number, lastOccurrenceIndex: number } |
    { type: 'before' } |
    { type: 'between', indexA: number, indexB: number } |
    { type: 'after' }
  ) {
    if (this.timeline.length === 0) {
      return { type: 'before' };
    }

    let beginning = 0;
    const len = this.timeline.length;
    let end = len;
    if (len > 0 && this.timeline[len - 1].time <= tick) {
      return { type: 'after' };
    }

    while (beginning < end) {
      // calculate the midpoint for roughly equal partition
      const midPoint = Math.floor(beginning + (end - beginning) / 2);
      const event = this.timeline[midPoint];
      const nextEvent = this.timeline[midPoint + 1];
      if (event.time === tick) {
        let firstOccurrenceIndex = midPoint;
        for (let i = midPoint; i > 0; i--) {
          if (this.timeline[i].time !== tick) {
            break;
          }
          firstOccurrenceIndex = i;
        }

        let lastOccurrenceIndex = midPoint;
        for (let i = midPoint; i < this.timeline.length; i++) {
          if (this.timeline[i].time !== tick) {
            break;
          }
          lastOccurrenceIndex = i;
        }

        return { type: 'hit', firstOccurrenceIndex, lastOccurrenceIndex };
      } else if (event.time < tick && nextEvent.time > tick) {
        return { type: 'between', indexA: midPoint, indexB: midPoint + 1 };
      } else if (event.time > tick) {
        // search lower
        end = midPoint;
      } else {
        // search upper
        beginning = midPoint + 1;
      }
    }

    return { type: 'before' };
  }
}
