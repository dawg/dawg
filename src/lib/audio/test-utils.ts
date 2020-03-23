import { getContext, setContext } from '@/lib/audio/global';
import { ObeoOfflineContext, createOfflineContext, RunOfflineOptions } from '@/lib/audio/offline';
import { Seconds } from '@/lib/audio/types';
import { ObeoBuffer, createAudioBuffer } from '@/lib/audio/buffer';
import dsp from 'dsp.js';
import windowing from 'fft-windowing';
import { expect } from '@/lib/testing';

export function whenBetween(value: Seconds, start: Seconds, stop: Seconds, callback: () => void): void {
  if (value >= start && value < stop) {
    callback();
  }
}

export function atTime(when: Seconds, callback: (time: Seconds) => void): (time: Seconds) => void {
  let wasInvoked = false;
  return (time) => {
    if (time >= when && !wasInvoked) {
      callback(time);
      wasInvoked = true;
    }
  };
}

export const compareToFile = async (
  cb: (offline: ObeoOfflineContext) => void,
  file: string,
  options: Partial<RunOfflineOptions & { threshold: number }> = {},
) => {
  const { duration = 0.1, threshold = 0.1 } = options;
  const url = '/base/src/assets/' + file;
  const response = await fetch(url);
  expect(response.status).to.eq(200, 'Status is: ' + response.status);
  const blob = await response.blob();
  const reader = new FileReader();

  const getArrayBuffer = (): Promise<ArrayBuffer> => {
    return new Promise<ArrayBuffer>((resolve) => {
      reader.onload = () => {
        resolve(reader.result as ArrayBuffer);
      };

      reader.readAsArrayBuffer(blob);
    });
  };

  const arrayBuffer = await getArrayBuffer();

  const origContext = getContext();
  try {

    // prefix + "audio/compare/" + url, threshold, RENDER_NEW, duration, channels
    const offlineContext = createOfflineContext({
      length: duration * 44100,
      sampleRate: 44100,
      numberOfChannels: 1,
    });

    // const audioBuffer = await blobToAudioBuffer(origContext, blob);
    const targetBuffer = await offlineContext.decodeAudioData(arrayBuffer);

    setContext(offlineContext);
    await cb(offlineContext);
    const actualBuffer = await offlineContext.render();

    const analysisA = analyse(createAudioBuffer(targetBuffer), 1024, 64);
    const analysisB = analyse(createAudioBuffer(actualBuffer), 1024, 64);

    expect(analysisA.length).to.be.gte(1, `The target buffer analysis is empty (${targetBuffer.length})`);
    expect(analysisB.length).to.be.gte(1, `The actual buffer analysis is empty (${actualBuffer.length})`);

    const minColum = Math.min(analysisA.length, analysisB.length);

    let diff = 0;
    for (let i = 0; i < minColum; i++) {
      const columnA = analysisA[i];
      const columnB = analysisB[i];
      columnA.forEach((valA, index) => {
        const valB = columnB[index];
        diff += Math.pow(valA - valB, 2);
      });
    }

    const error = Math.sqrt(diff / analysisA.length);

    if (error > threshold) {
      throw new Error(`Error ${error} greater than threshold ${threshold}`);
    }
  } finally {
    setContext(origContext);
  }
};

export function analyse(buffer: ObeoBuffer, fftSize = 256, hopSize = 128): Float64Array[] {
  const spectrogram: Float64Array[] = [];
  buffer.toMono().toArray().forEach((channel) => {
    for (let index = 0; index < channel.length - fftSize; index += hopSize) {
      const FFT = new dsp.FFT(fftSize, buffer.sampleRate);
      const segment = windowing.blackman_harris(channel.slice(index, index + fftSize));
      FFT.forward(segment);
      spectrogram.push(FFT.spectrum);
    }
  });
  return spectrogram;
}

export const createTestAudioBuffer = (arr: number[], ...arrs: number[][]): ObeoBuffer => {
  const sampleRate = 44100;
  const offline = createOfflineContext({ length: 0.1 * sampleRate, sampleRate });
  const audioBuffer = offline.createBuffer(arrs.length + 1, arr.length, 44100);

  for (let i = 0; i < arrs.length + 1; i++) {
    const data = audioBuffer.getChannelData(i);

    (i === 0 ? arr : arrs[i - 1]).forEach((value, j) => {
      data[j] = value;
    });
  }

  return createAudioBuffer(audioBuffer);
};

export const warns = (cb: () => void) => {
  // tslint:disable-next-line:no-console
  const original = console.warn;
  let warned = false;
  // tslint:disable-next-line:no-console
  console.warn = () => {
    warned = true;
  };

  try {
    cb();
  } finally {
    // tslint:disable-next-line:no-console
    console.warn = original;
  }

  expect(warned).to.eq(true, 'Warning did not occur!');
};
