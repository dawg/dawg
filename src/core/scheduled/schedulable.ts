import * as t from 'io-ts';
import Tone from 'tone';
import * as Audio from '@/modules/audio';
import { toTickTime } from '@/utils';

export const SchedulableType = t.type({
  row: t.number,
  time: t.number,
  duration: t.number,
});

export type ISchedulable = t.TypeOf<typeof SchedulableType>;

export abstract class Schedulable {
  /**
   * The component name to mount in the `Sequencer`.
   */
  public readonly abstract component: string;

  /**
   * Refers to row where the element is placed.
   * For notes, these are numbered 0 -> 87 and start from the higher frequencies.
   */
  public row: number;

  /**
   * Time in beats.
   */
  public time: number;

  /**
   * Private duration in beats.
   */
  private beats: number;
  private eventId?: string;
  private transport?: Audio.Transport;

  constructor(i: ISchedulable) {
    this.row = i.row;
    this.time = i.time;
    this.beats = i.duration;
    this.duration = i.duration; // TODO(jacob)
  }

  /**
   * Duration in beats.
   */
  get duration() {
    return this.beats;
  }

  set duration(value: number) {
    this.beats = value;

    if (this.transport && this.eventId) {
      const event = this.transport.get(this.eventId);

      if (!(event instanceof Tone.TransportRepeatEvent)) {
        return;
      }

      event.duration = new Tone.Ticks(toTickTime(value));
    }

    this.updateDuration(value);
  }

  get tickTime() {
    return toTickTime(this.time);
  }

  get endBeat() {
    return this.time + this.duration;
  }

  public remove(transport: Audio.Transport) {
    if (this.eventId !== undefined) {
      transport.clear(this.eventId);
    }
  }

  public schedule(transport: Audio.Transport) {
    this.transport = transport;

    const eventId = this.add(transport);
    if (eventId !== undefined && eventId !== null) {
      this.eventId = eventId;
    }
  }

  public dispose() {
    if (this.transport && this.eventId !== undefined) {
      this.transport.clear(this.eventId);
    }
  }

  public abstract copy(): Schedulable;

  protected updateDuration(duration: number) {
    // TODO move to event emitter
  }

  /**
   * Add yourself to the transport. Return null if it's not possible.
   *
   * @param transport The target transport.
   */
  protected abstract add(transport: Audio.Transport): string | null;
}
