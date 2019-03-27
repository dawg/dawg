import StrictEventEmitter from 'strict-event-emitter-types';
import { EventEmitter } from 'events';

interface Events {
  start: (provider: Provider) => void;
}

export const bus: StrictEventEmitter<EventEmitter, Events> = new EventEmitter();

type ProviderEventEmitter = StrictEventEmitter<EventEmitter, { dispose: (provider: Provider) => void }>;

export class Provider extends (EventEmitter as new() => ProviderEventEmitter) {
  public progress: number | null = null;
  private disposed = false;

  constructor(
    public message: string | null,
    public estimate: number | null,
  ) {
    super();
    this.updateProgress();
  }

  /**
   * Set the message. This replaces the current message.
   * @param message The message.
   */
  public setMessage(message: string) {
    if (this.disposed) {
      return;
    }

    this.message = message;
  }

  /**
   * Update the progress. This should be a value between 0 and 100. This will be ignored if progress is set.
   * @param value The value.
   */
  public setProgress(value: number) {
    if (this.disposed) {
      return;
    }

    if (this.estimate !== null) {
      return;
    }

    this.progress = value;
  }

  /**
   * Dispose of this provider. This removes the text and progress information from the busy signal. Any further calls
   * to this provider will be ignored.
   */
  public dispose() {
    this.message = null;
    this.progress = null;
    this.disposed = true;
    this.emit('dispose', this);
  }

  /**
   * Updates the progress if an estimate is given.
   */
  private updateProgress() {
    if (this.estimate === null) {
      return;
    }

    const timeout = Math.max(this.estimate / 100, 0.2);
    const nCalls = this.estimate / timeout;
    const increment = 100 / nCalls;

    // Set to 0 if null
    // This means that this is the first time we called this function
    // Also, don't update the progress if it is null, just set it to 0
    if (this.progress === null) {
      this.progress = 0;
    } else {
      this.progress = Math.min(this.progress + increment, 100);
    }

    if (this.progress < 100) {
      setTimeout(this.updateProgress.bind(this), timeout * 1000);
    }
  }
}
