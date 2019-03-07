interface WavBuffer {
  channelData: number[][],
  sampleRate: number,
}

declare module 'node-wav' {
  function decode(buffer: Buffer): WavBuffer;
}