import * as t from '@/lib/io';
import * as Audio from '@/lib/audio';
import { StrictEventEmitter } from '@/lib/events';
import { Beat } from '@/lib/audio/types';
import * as history from '@/core/project/history';

export const SchedulableType = t.intersection([
  t.type({
    row: t.number,
    time: t.number,
    duration: t.number,
  }),
  t.partial({
    offset: t.number,
  }),
]);

export type ISchedulable = t.TypeOf<typeof SchedulableType>;

interface Opts {
  disableOffset?: boolean;
}

export abstract class Schedulable extends StrictEventEmitter<{ remove: [], undoRemove: [] }> {
  /**
   * The component name to mount in the `Sequencer`.
   */
  public readonly abstract component: string;
  public readonly disableOffset: boolean;

  /**
   * Refers to row where the element is placed.
   * For notes, these are numbered 0 -> 87 and start from the higher frequencies.
   */
  public row: number;

  protected readonly abstract sliceMode: 'duplicate' | 'offset';

  // tslint:disable-next-line:variable-name
  private _time: number;

  /**
   * Private duration in beats.
   */
  private beats: number;
  // tslint:disable-next-line:variable-name
  private _offset: number;
  private controller?: Audio.TransportEventController;

  constructor(i: ISchedulable, opts: Opts = {}) {
    super();
    this.row = i.row;
    this._offset = i.offset || 0;
    // this.offset = i.offset;
    this._time = i.time;
    this.beats = i.duration;
    this.duration = i.duration;
    this.disableOffset = opts.disableOffset || false;
  }

  get offset() {
    return this._offset;
  }

  set offset(offset: number) {
    this._offset = offset;
    if (this.controller) {
      this.controller.setOffset(offset);
    }
  }

  /**
   * Duration in beats.
   */
  get duration() {
    return this.beats;
  }

  set duration(value: number) {
    this.beats = value;
    if (this.controller) {
      this.controller.setDuration(value);
    }
  }

  /**
   * Time in beats.
   */
  get time() {
    return this._time;
  }

  set time(time: Beat) {
    this._time = time;
    if (this.controller) {
      this.controller.setStartTime(time);
    }
  }

  get endBeat() {
    return this.time + this.duration;
  }

  public schedule(transport: Audio.Transport) {
    this.controller = this.add(transport);
  }

  public slice(time: Beat) {
    if (time <= this.time || time >= this.time + this.duration) {
      return;
    }

    const newDuration = time - this.time;
    const otherElementDuration = this.duration - newDuration;

    const newElement = this.copy();
    newElement.duration = otherElementDuration;
    this.duration = newDuration;

    if (this.sliceMode === 'duplicate') {
      newElement.time += newDuration;
    } else if (this.sliceMode === 'offset') {
      newElement.offset = newDuration;
    }

    return newElement;
  }

  public removeNoHistory() {
    if (this.controller) {
      this.controller.remove();
      this.emit('remove');
    }
  }

  public remove() {
    history.execute({
      execute: () => {
        this.removeNoHistory();
      },
      undo: () => {
        if (this.controller) {
          this.controller.undoRemove();
          this.emit('undoRemove');
        }
      },

    });
  }

  public dispose() {
    this.removeNoHistory();
    super.dispose();
  }

  public abstract copy(): Schedulable;

  /**
   * Add yourself to the transport. Return null if it's not possible.
   *
   * @param transport The target transport.
   */
  protected abstract add(transport: Audio.Transport): Audio.TransportEventController | undefined;
}
