import Vue from 'vue';
import { createExtension } from '@/dawg/extensions';
import * as dawg from '@/dawg';
import ExportProgressModal from '@/dawg/extensions/extra/exporter/ExportProgressModal.vue';
import { ref } from '@vue/composition-api';
import * as Audio from '@/modules/audio';
import { remote } from 'electron';
import { oggToMp3, blobsToAudioBuffer } from '@/modules/converter';
import stream from 'stream';

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

    const dest = Audio.context.createMediaStreamDestination();
    Audio.MasterAudioNode.connect(dest);

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
            console.log('Recording stopped. Creating blob and then reading in as ArrayBuffer.');
            // const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
            const reader = new FileReader();
            const buffer = await blobsToAudioBuffer(Audio.context, chunks, 'audio/ogg; codecs=opus');

            const onLoadEnd = async () => {
              console.log('ArrayBuffer loading has finished. The result is: ', reader.result);
              reader.removeEventListener('loadend', onLoadEnd, false);
              const buffer = Buffer.from(reader.result as any);
              const readableInstanceStream = new stream.Readable({
                read() {
                  this.push(buffer);
                  this.push(null);
                },
              });

              const result = await oggToMp3(readableInstanceStream, filePath);
              // go();
              if (result.result === 'success') {
                dawg.notify.info('Successfully exported track as Mp3');
              } else {
                dawg.notify.error('Unable to convert export track as Mp3: ' + result.error);
              }
            };

            reader.addEventListener('loadend', onLoadEnd, false);
            reader.readAsArrayBuffer(blob);
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
              // TODO We will have to figure this out.
              dawg.project.master.transport.stop();
              dawg.project.master.transport.beat = beat;
              dawg.project.master.transport.loopStart = loopStart;
              dawg.project.master.transport.loopEnd = loopEnd;
              open.value = false;
              recorder.stop();
              disposer.dispose();
            },
          });

          dawg.project.stopIfStarted();
          dawg.project.master.transport.start();
        };

        const path = remote.dialog.showSaveDialog(remote.getCurrentWindow(), {}) || null;
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
