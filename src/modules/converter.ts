import fs from 'fs';
import ogg from 'ogg';
import lame from 'lame';
import opus from 'node-opus';
import { Readable } from 'stream';

type Result =
  { result: 'success' } |
  { result: 'error', error: string };

export const oggToMp3 = (oggStream: Readable, mp3Path: string): Promise<Result> => {
  return new Promise((resolve) => {
    const od = new ogg.Decoder();

    od.on('stream', (stream) => {
      console.log('Starting stream');
      const vd = new opus.Decoder();

      // the "format" event contains the raw PCM format
      vd.on('format', (format) => {
        console.log('Given format', format);
        const bytesPerSample = format.bitDepth / 8;
        const encoder = new lame.Encoder();
        const out = fs.createWriteStream(mp3Path);
        encoder.pipe(out);

        let leftover: Uint8Array;
        vd.on('data', (b: Uint8Array) => {
          console.log('Data received!');

          // first we have to make sure that the Buffer we got is a multiple of
          // "float" sized, so that it will fit nicely into a Float32Array
          if (leftover) {
            b = Buffer.concat([ leftover, b ]);
          }
          // tslint:disable-next-line:no-bitwise
          const len = (b.length / bytesPerSample | 0) * bytesPerSample;
          if (len !== b.length) {
            // tslint:disable-next-line:no-console
            console.error('resizing Buffer from %d to %d', b.length, len);
            leftover = b.slice(len);
            b = b.slice(0, len);
          }

          // now that we know "b" is aligned to "float" sized, create a TypedArray
          // from it, and create an output Buffer where the "int" samples will go
          const floatSamples = new Float32Array(b);
          const o = new Buffer(floatSamples.length * 2);
          const intSamples = new Int16Array(o);

          // we need to convert all the float samples into short int samples
          // and populate the "intSamples" array
          for (let i = 0; i < floatSamples.length; i++) {
            const f = floatSamples[i];
            let val = Math.floor(f * 32767.0 + 0.5);

            // might as well guard against clipping
            if (val > 32767) {
              // tslint:disable-next-line:no-console
              console.error('clipping detected: %d -> %d', val, 32767);
              val = 32767;
            }
            if (val < -32768) {
              // tslint:disable-next-line:no-console
              console.error('clipping detected: %d -> %d', val, -32768);
              val = -32768;
            }
            intSamples[i] = val;
          }

          // write the populated "intSamples" Buffer to the lame encoder
          encoder.write(o);
        });
      });

      // an "error" event will get emitted if the stream is not a Vorbis stream
      // (i.e. it could be a Theora video stream instead)
      vd.on('error', (error) => {
        resolve({ result: 'error', error: error.message });
      });

      vd.on('close', () => {
        resolve({ result: 'success' });
      });

      stream.pipe(vd);
    });

    console.log('Pipping to ogg.Decoder!');
    // stream = fs.createReadStream(process.argv[2])
    oggStream.pipe(od);
  });
};

export function blobsToAudioBuffer(context: AudioContext, blobs: Blob[], type?: string): Promise<AudioBuffer> {
  const reader = new FileReader();
  return new Promise<AudioBuffer>((resolve) => {
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      context.decodeAudioData(buffer).then((decodedBuffer) => {
        resolve(decodedBuffer);
      });
    };

    let opts;
    if (type) {
      opts = { type };
    }

    const audioBlob = new Blob(blobs, opts);
    reader.readAsArrayBuffer(audioBlob);
  });
}
