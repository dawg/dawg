import { EventEmitter } from 'events';

export interface Events {
  [name: string]: any[];
}

type EventListeners<E extends Events> = { [K in keyof E]: (...args: E[K]) => void };

type GenericListener = (...args: any[]) => void;

export class StrictEventEmitter<E extends Events> {
  private emitter = new EventEmitter();

  public addListener<T extends keyof E & string>(event: T, listener: (...args: E[T]) => void) {
    return this.on(event, listener as GenericListener);
  }

  public addListeners(listeners: Partial<EventListeners<E>>) {
    const disposers = Object.entries(listeners).map(([event, listener]) => {
      if (listener) {
        return this.on(event, listener);
      }
    });

    return {
      dispose: () => {
        disposers.forEach((disposer) => {
          if (disposer) {
            disposer.dispose();
          }
        });
      },
    };
  }

  public on<T extends keyof E & string>(event: T, listener: (...args: E[T]) => void) {
    this.emitter.on(event, listener as GenericListener);
    return {
      dispose: () => {
        this.removeListener(event, listener);
      },
    };
  }

  public once<T extends keyof E & string>(event: T, listener: (...args: E[T]) => void) {
    this.emitter.once(event, listener as GenericListener);
  }

  public removeListener<T extends keyof E & string>(event: T, listener: (...args: E[T]) => void) {
    this.emitter.removeListener(event, listener as GenericListener);
  }

  public off<T extends keyof E & string>(event: T, listener: (...args: E[T]) => void) {
    this.emitter.off(event, listener as GenericListener);
  }

  public removeAllListeners<T extends keyof E & string>(event?: T) {
    this.emitter.removeAllListeners(event);
  }

  public emit<T extends keyof E & string>(event: T, ...args: E[T]) {
    this.emitter.emit(event, ...args);
  }

  public dispose() {
    this.removeAllListeners();
  }
}

export function emitter<E extends Events>() {
  return new StrictEventEmitter<E>();
}

type WindowEvents = keyof WindowEventMap;

type WindowEventListener<K extends WindowEvents> = (ev: WindowEventMap[K]) => any;

type WindowEventListeners = {
  [P in keyof WindowEventMap]?: WindowEventListener<P> | 'remove';
};

/**
 * Add 0 or more event listeners and return an object with a dispose method to remove the listeners.
 *
 * @param events The events.
 * @param options The options.
 */
export const addEventListeners = (
  events: WindowEventListeners,
  options?: boolean | AddEventListenerOptions,
) => {
  const types = Object.keys(events) as WindowEvents[];

  const remove = () => {
    for (const type of types) {
      const ev = events[type];
      if (ev === 'remove') {
        continue;
      }

      window.removeEventListener(type, ev as any);
    }
  };

  for (const type of types) {
    const ev = events[type];
    if (ev === 'remove') {
      // @ts-ignore
      // There is a weird error with union types
      // Going to just ignore this
      events[type] = remove;
    }
    window.addEventListener(type, ev as any, options);
  }


  return {
    dispose: remove,
  };
};

/**
 * Add an event listener (like normal) but return an object with a dispose method to remove the same listener.
 *
 * @param type The event.
 * @param ev The listener.
 * @param options The options.
 */
export const addEventListener = <K extends WindowEvents>(
  type: K,
  ev: WindowEventListener<K>,
  options?: boolean | AddEventListenerOptions,
) => {
  window.addEventListener(type, ev, options);

  return {
    dispose: () => {
      window.removeEventListener(type, ev);
    },
  };
};

export {
  EventEmitter,
};
