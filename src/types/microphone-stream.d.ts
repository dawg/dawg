declare module 'microphone-stream' {
  class MicrophoneStream {
    constructor( opts: object );
    setStream(stream: MediaStream): void;
    stop(): void;
    
    toRaw(chunk: Buffer): Float32Array; 
  }
}