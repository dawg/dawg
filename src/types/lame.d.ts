declare module 'lame' {
  export class Encoder {
    pipe<T extends NodeJS.WritableStream>(destination: T, options?: { end?: boolean; }): T;
    write(buffer: Buffer): void;
  }   
}