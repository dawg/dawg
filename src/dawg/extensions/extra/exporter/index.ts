import Vue from 'vue';
import { createExtension } from '@/dawg/extensions';
import * as dawg from '@/dawg';
import ExportProgressModal from '@/dawg/extensions/extra/exporter/ExportProgressModal.vue';
import { ref } from '@vue/composition-api';
import * as Audio from '@/modules/audio';
import { remote } from 'electron';
import { blobsToAudioBuffer, audioBufferToWav } from '@/modules/converter';
import fs from '@/fs';
import Tone from 'tone';

export const extension = createExtension({
  id: 'dawg.spectrogram',
  activate(context) {
    const progress = ref(0);
    const open = ref(false);

    dawg.ui.global.push(Vue.extend({
      components: { ExportProgressModal },
      template: `
      <export-progress-modal
        :progress="progress.value"
        :open="open.value"
      ></export-progress-modal>
      `,
      data: () => ({
        progress,
        open,
      }),
    }));

    const dest = Audio.Context.context.createMediaStreamDestination();
    Audio.Master.connect(dest);

    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    const command = {
      text: 'Export',
      callback: () => {
        const record = (filePath: string) => {
          open.value = true;
          progress.value = 0;

          const recorder = new MediaRecorder(dest.stream);
          const chunks: Blob[] = [];
          recorder.ondataavailable = (e) => {
            chunks.push(e.data);
            progress.value = dawg.project.master.transport.getProgress() * 100;
          };

          recorder.onstop = async () => {
            // const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
            const buffer = await blobsToAudioBuffer(Audio.Context.context, chunks);
            const arrayBuffer = await audioBufferToWav(buffer);
            try {
              await fs.writeFile(filePath, Buffer.from(arrayBuffer));
              dawg.notify.info('Successfully exported track as WAV at ' + filePath);
            } catch (e) {
              dawg.notify.error('Unable to convert export track as WAV: ' + e.message);
            }
          };

          const beat = dawg.project.master.transport.beat;
          const loopStart = dawg.project.master.transport.loopStart;
          const loopEnd = dawg.project.master.transport.loopEnd;

          let started = false;
          const disposer = dawg.project.master.transport.addListeners({
            beforeStart: () => {
              if (!started) {
                started = true;
                // Beware, this may add some empty sound at the start of the recording as we start this a bit
                // prematurely.
                // Ideally, we start this RIGHT before the start of the playlist.
                // This is not easy to do though.
                recorder.start(100);
              }
            },
            beforeEnd: () => {
              // This is probably not where we want to stop the recording.
              // FIXME We will have to figure this out.
              dawg.project.master.transport.stop();
              dawg.project.master.transport.beat = beat;
              dawg.project.master.transport.loopStart = loopStart;
              dawg.project.master.transport.loopEnd = loopEnd;
              open.value = false;
              Tone.Master.mute = false;
              recorder.stop();
              disposer.dispose();
            },
          });

          dawg.project.stopIfStarted();
          Tone.Master.mute = true;
          dawg.project.master.transport.start();
        };

        const path = remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
          filters: [{ name: 'WAV', extensions: ['wav'] }],
        });

        if (!path) {
          return;
        }

        record(path);
      },
    };

    context.subscriptions.push(dawg.commands.registerCommand(command));

    const file = dawg.menubar.getMenu('File');
    context.subscriptions.push(file.addItem(command));
  },
});
