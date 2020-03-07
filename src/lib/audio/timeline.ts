import { Ticks } from '@/lib/audio/types';

/**
 *  @class A Timeline class for scheduling and maintaining state
 *         along a timeline. All events must have a "time" property.
 *         Internally, events are stored in time order for fast
 *         retrieval.
 */
export class Timeline<T extends { time: Ticks; offset: Ticks }> {
  private timeline: T[] = [];

  public add(event: T) {
    const result = this.search(this.getStart(event));
    const index =
      result.type === 'before' ? 0 :
      result.type === 'after' ? this.timeline.length :
      result.type === 'between' ? result.indexB :
      result.lastOccurrenceIndex + 1;

    // This inserts the event at the given index
    this.timeline.splice(index, 0, event);
  }

  /**
   *  Remove an event from the timeline.
   *  @param  event The event object to remove from the list.
   *  @returns this
   */
  public remove(event: T): boolean {
    const index = this.timeline.indexOf(event);
    if (index !== -1) {
      this.timeline.splice(index, 1);
      return true;
    }

    return false;
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
  public search(tick: Ticks): (
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
    if (len > 0 && this.getStart(this.timeline[len - 1]) < tick) {
      return { type: 'after' };
    }

    while (beginning < end) {
      // calculate the midpoint for roughly equal partition
      const midPoint = Math.floor(beginning + (end - beginning) / 2);
      const event = this.timeline[midPoint];
      const nextEvent = this.timeline[midPoint + 1];
      if (this.getStart(event) === tick) {
        let firstOccurrenceIndex = midPoint;
        for (let i = midPoint; i >= 0; i--) {
          if (this.getStart(this.timeline[i]) !== tick) {
            break;
          }
          firstOccurrenceIndex = i;
        }

        let lastOccurrenceIndex = midPoint;
        for (let i = midPoint; i < this.timeline.length; i++) {
          if (this.getStart(this.timeline[i]) !== tick) {
            break;
          }
          lastOccurrenceIndex = i;
        }

        return { type: 'hit', firstOccurrenceIndex, lastOccurrenceIndex };
      } else if (this.getStart(event) < tick && this.getStart(nextEvent) > tick) {
        return { type: 'between', indexA: midPoint, indexB: midPoint + 1 };
      } else if (this.getStart(event) > tick) {
        // search lower
        end = midPoint;
      } else {
        // search upper
        beginning = midPoint + 1;
      }
    }

    return { type: 'before' };
  }

  private getStart(event: T) {
    return event.time + event.offset;
  }
}
