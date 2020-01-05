declare module 'ogg' {
  class Stream {
    pipe<T extends NodeJS.WritableStream>(destination: T, options?: { end?: boolean; }): T;
  }

  export class Decoder implements NodeJS.WritableStream {
    writable: boolean;
    write(buffer: string | Buffer, cb?: Function | undefined): boolean;
    write(str: string, encoding?: string | undefined, cb?: Function | undefined): boolean;
    end(cb?: Function | undefined): void;
    end(buffer: Buffer, cb?: Function | undefined): void;
    end(str: string, cb?: Function | undefined): void;
    end(str: string, encoding?: string | undefined, cb?: Function | undefined): void;
    addListener(event: string | symbol, listener: (...args: any[]) => void): this;
    once(event: string | symbol, listener: (...args: any[]) => void): this;
    removeListener(event: string | symbol, listener: (...args: any[]) => void): this;
    off(event: string | symbol, listener: (...args: any[]) => void): this;
    removeAllListeners(event?: string | symbol | undefined): this;
    setMaxListeners(n: number): this;
    getMaxListeners(): number;
    listeners(event: string | symbol): Function[];
    rawListeners(event: string | symbol): Function[];
    emit(event: string | symbol, ...args: any[]): boolean;
    listenerCount(type: string | symbol): number;
    prependListener(event: string | symbol, listener: (...args: any[]) => void): this;
    prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;
    eventNames(): (string | symbol)[];
    on(stream: 'stream', callback: (stream: Stream) => void): this;
  }
}