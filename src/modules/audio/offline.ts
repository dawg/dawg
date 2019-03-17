import Tone from 'tone';

export default function(callback: any, duration: any, channels?: any) {
  duration = duration || 0.1;
  channels = channels || 1;
  // @ts-ignore
  return Tone.Offline((Transport) => {
    const testFn = callback(Transport);
    // @ts-ignore
    if (testFn && Tone.isFunction(testFn.then)) {
      return testFn;
      // @ts-ignore
    } else if (Tone.isFunction(testFn)) {
      Transport.context.on('tick', () => {
        testFn(Transport.now());
      });
    }
  }, duration).then((buffer: any) => {
    // Tone.BufferTest(buffer);
    if (channels === 1) {
      buffer.toMono();
    }
    return buffer;
  });
}
