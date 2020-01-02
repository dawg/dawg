import Vue from 'vue';
import { createExtension } from '@/dawg/extensions';
import * as dawg from '@/dawg';
import ExportProgressModal from '@/dawg/extensions/extra/exporter/ExportProgressModal.vue';
import { ref } from '@vue/composition-api';
import * as Audio from '@/modules/audio';
import { remote } from 'electron';

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
        const record = (name: string) => {
          if (name === '') {
            return;
          }

          open.value = true;
          progress.value = 0;

          const recorder = new MediaRecorder(dest.stream);
          const chunks: Blob[] = [];
          recorder.ondataavailable = (e) => {
            chunks.push(e.data);
            progress.value = dawg.project.master.transport.getProgress() * 100;
          };

          recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
            const url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = name;
            a.click();
            window.URL.revokeObjectURL(url);
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

        dawg.palette.showInputBox({
          placeholder: 'File Name',
          onDidInput: record,
        });
      },
    };

    context.subscriptions.push(dawg.commands.registerCommand(command));

    const file = dawg.menubar.getMenu('File');
    context.subscriptions.push(file.addItem(command));
  },
});
