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

  // public prependListener<T extends keyof E & string>(event: T, listener: (...args: E[T]) => void) {
  //   this.emitter.prependListener(event, listener as GenericListener);
  // }

  // public prependOnceListener<T extends keyof E & string>(
  //   event: T, listener: (...args: E[T]) => void,
  // ) {
  //   this.emitter.prependOnceListener(event, listener as GenericListener);
  // }

  public removeListener<T extends keyof E & string>(event: T, listener: (...args: E[T]) => void) {
    this.emitter.removeListener(event, listener as GenericListener);
  }

  public off<T extends keyof E & string>(event: T, listener: (...args: E[T]) => void) {
    this.emitter.off(event, listener as GenericListener);
  }

  public removeAllListeners<T extends keyof E & string>(event?: T) {
    this.emitter.removeAllListeners(event);
  }

  // public setMaxListeners(n: number) {
  //   this.emitter.setMaxListeners(n);
  // }

  // public getMaxListeners(): number {
  //   return this.emitter.getMaxListeners();
  // }

  // public listeners<T extends keyof E & string>(event: T) {
  //   return this.emitter.listeners(event) as Array<(...args: E[T]) => void>;
  // }

  // public rawListeners<T extends keyof E & string>(event: T) {
  //   return this.emitter.rawListeners(event) as Array<(...args: E[T]) => void>;
  // }

  public emit<T extends keyof E & string>(event: T, ...args: E[T]) {
    this.emitter.emit(event, ...args);
  }

  // public eventNames() {
  //   return this.emitter.eventNames() as Array<keyof E & string>;
  // }

  public dispose() {
    this.removeAllListeners();
  }
}

export function emitter<E extends Events>() {
  return new StrictEventEmitter<E>();
}

export {
  EventEmitter,
};
