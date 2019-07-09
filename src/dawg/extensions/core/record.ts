import { Extension } from '@/dawg/extensions';
import { commands } from '@/dawg/extensions/core/commands';
import { palette } from '@/dawg/extensions/core/palette';
import { notify } from '@/dawg/extensions/core/notify';
import * as Audio from '@/modules/audio';
import audioBufferToWav from 'audiobuffer-to-wav';
import path from 'path';
import fs from '@/wrappers/fs';
import { ChunkGhost } from '@/core/ghosts/ghost';
import { remote } from 'electron';
import { Sample, ScheduledSample } from '@/core';
import { workspace, general } from '@/store';
import { value, Wrapper } from 'vue-function-api';
import { manager } from '../manager';
import { project } from './project';
import { applicationContext } from './application-context';

export const DOCUMENTS_PATH = remote.app.getPath('documents');
export const RECORDING_PATH = path.join(DOCUMENTS_PATH, remote.app.getName(), 'recordings');

function blobsToAudioBuffer(blobs: Blob[]): Promise<AudioBuffer> {
  const reader = new FileReader();
  return new Promise<AudioBuffer>((resolve, reject) => {
    reader.onload = (event) => {
      const buffer = reader.result as ArrayBuffer;
      Audio.context.decodeAudioData(buffer).then((decodedBuffer) => {
        resolve(decodedBuffer);
      });
    };
    const audioBlob = new Blob(blobs);
    reader.readAsArrayBuffer(audioBlob);
  });
}

function makeFileName() {
  const date = new Date();
  return 'recording-'
  + date.getFullYear() + '-'
  + date.getMonth() + '-'
  + date.getDay() + '-'
  + date.getHours() +
  + date.getMinutes() +
  + date.getSeconds() +
  '.wav';
}

let ghosts: ChunkGhost[] = [];

export const extension: Extension<{}, { microphoneIn: string }, {}, { recording: Wrapper<boolean> }> = {
  id: 'dawg.record',
  activate(context) {
    const recording = value(false);

    let mediaRecorder: MediaRecorder | null = null;

    context.subscriptions.push(project.onDidPlayPause(() => {
      if (mediaRecorder) {
        stopRecording();
      }
    }));

    const startRecording = async (trackId: number) => {
      project.stopIfStarted();
      applicationContext.context.value = 'playlist';
      const time = general.project.master.transport.beats;

      const microphoneIn = context.global.get('microphoneIn');
      if (microphoneIn === undefined) {
        notify.info('Please select a microphone from the settings.');
        return;
      }

      let deviceId: string | null = null;

      // enumerate devices and find our input device
      const devices = await navigator.mediaDevices.enumerateDevices();
      devices.forEach((device) => {
        if ( device.label === microphoneIn ) {
          deviceId = device.deviceId;
        }
      });

      if (deviceId === null) {
        notify.info('Selected microphone is no longer available.');
        return;
      }

      // create new chunk ghost
      const ghost = new ChunkGhost(time, trackId);
      ghosts.push(ghost);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId }, video: false });
      mediaRecorder = new MediaRecorder(stream);
      const audioBlobs: Blob[] = [];
      mediaRecorder.start(100);

      // keep the ghost updated
      mediaRecorder.ondataavailable = async (event: BlobEvent) => {
        if (!recording.value) {
          recording.value = true;
          project.startTransport();
        }

        audioBlobs.push(event.data);
        ghost.buffer = await blobsToAudioBuffer(audioBlobs);
      };

      mediaRecorder.onstop = async () => {
        const buffer = await blobsToAudioBuffer(audioBlobs);
        const wavData: ArrayBuffer = audioBufferToWav(buffer, {
          sampleRate: buffer.sampleRate,
          float: true,
          bitDepth: 32,
        });

        await fs.mkdirRecursive(RECORDING_PATH);

        const dst = path.join(RECORDING_PATH, makeFileName());
        try {
          fs.writeFile(dst, new DataView(wavData));
        } catch (e) {
          notify.error('' + e);
        }

        // add the file to the workspace
        // create a sample from the file.
        const master = general.project.master;
        const sample = Sample.create(dst, buffer);
        general.project.samples.push(sample);
        const scheduled = new ScheduledSample(sample, {
          type: 'sample',
          sampleId: sample.id,
          duration: sample.beats,
          row: trackId,
          time,
        });

        scheduled.schedule(master.transport);
        master.elements.push(scheduled);

        recording.value = false;
      };
    };

    const stopRecording = () => {
      if (mediaRecorder != null) {
        mediaRecorder.stop();
        mediaRecorder = null;
        ghosts = [];
      }
    };

    const disposable = commands.registerCommand({
      text: 'Record Audio',
      callback: async () => {
        const trackNumber = await palette.showNumberInputBox();
        startRecording(trackNumber);
      },
    });

    context.subscriptions.push(disposable);

    return {
      recording,
    };
  },
};


export const record = manager.activate(extension);
