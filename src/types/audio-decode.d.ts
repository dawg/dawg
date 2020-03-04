declare module 'audio-decode' {
  export default function(source: ArrayBuffer | ArrayBufferView | Buffer | Blob | File): Promise<AudioBuffer>;
}