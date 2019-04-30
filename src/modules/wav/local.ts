import wav from 'node-wav';
import fs from '@/wrappers/fs';
import Tone from 'tone';

function createBuffer(sampleRate: number, buffer: number[][]) {
  const numberOfChannels = buffer.length;
  const audioBuffer = Tone.context.createBuffer(numberOfChannels, buffer[0].length, sampleRate);

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

export async function loadBuffer(path: string) {
  const buffer = await fs.readFile(path);
  const result = wav.decode(buffer);

  const audioBuffer = createBuffer(
    result.sampleRate,
    result.channelData,
  );

  return audioBuffer;
}
