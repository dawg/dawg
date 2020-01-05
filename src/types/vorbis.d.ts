declare module 'node-opus' {
  import { Transform } from 'stream';

  export class Decoder extends Transform {
    constructor(rate?: number, channels?: number, frameSize?: number);
  }
}