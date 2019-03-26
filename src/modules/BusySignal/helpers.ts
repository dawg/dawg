import { Bus } from '../update';

export const bus = new Bus<{ start: [Provider] }>();

export class Provider extends Bus<{ dispose: [Provider] }> {
  private disposed = false;

  constructor(
    public message: string | null,
    public progress: number | null = null,
  ) {
    super();
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
   * Update the progress. This should be a value between 0 and 100.
   * @param value The value.
   */
  public setProgress(value: number) {
    if (this.disposed) {
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
    this.$emit('dispose', this);
  }
}
