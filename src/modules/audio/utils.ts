import wav from 'node-wav';
import Tone from 'tone';
import fs from 'fs';

function createBuffer(audioCtx: AudioContext, sampleRate: number, buffer: number[][]) {
  const numberOfChannels = buffer.length;
  const audioBuffer = audioCtx.createBuffer(numberOfChannels, buffer[0].length, sampleRate);

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    // This gives us the actual ArrayBuffer that contains the data
    const nowBuffering = audioBuffer.getChannelData(channel);

    for (let i = 0; i < audioBuffer.length; i++) {
      // Decoded Float32Array is like that
      // [[channel1 byte1, channel1 byte2, ...] [channel 2 byte1, channel2 byte2, ...]]
      nowBuffering[i] = buffer[channel][i];
    }
  }
  return audioBuffer;
}


export function loadPlayer(path: string) {
  const buffer = fs.readFileSync(path);
  const result = wav.decode(buffer);
  const audioCtx = new AudioContext();

  const audioBuffer = createBuffer(
    audioCtx,
    result.sampleRate,
    result.channelData,
  );

  return new Tone.Player(audioBuffer);
}
