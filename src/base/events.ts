import { EventEmitter } from 'events';
import StrictEventEmitter from 'strict-event-emitter-types';

export type StrictEventsClass<T> = StrictEventEmitter<EventEmitter, T>;

export function createEmitterClass<T>() {
  return class extends (EventEmitter as new() => StrictEventsClass<T>) {};
}

export function emitter<T>() {
  const Class = createEmitterClass<T>();
  return new Class();
}

export class EventProvider<T> {
  constructor(private events: StrictEventsClass<T>, private event: keyof T & string, private callback: () => void) {
    this.events.on(this.event, this.callback);
  }

  public dispose() {
    this.events.off(this.event, this.callback);
  }
}

export {
  EventEmitter,
};
