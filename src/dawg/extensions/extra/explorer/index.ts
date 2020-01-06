import FileExplorer from '@/dawg/extensions/extra/explorer/FileExplorer.vue';
import * as dawg from '@/dawg';
import * as t from '@/modules/io';
import { remote } from 'electron';
import { Extensions } from '@/dawg/extensions/extra/explorer/types';
import { loadBuffer } from '@/modules/wav/local';
import parser from '@/midi-parser';
import fs from '@/fs';
import { ScheduledSample, Sample } from '@/core';
import { commands } from '@/dawg/extensions/core/commands';
import { sampleViewer } from '@/dawg/extensions/core/sample-viewer';
import { createExtension } from '@/dawg/extensions';
import { createComponent } from '@vue/composition-api';
import { vueExtend } from '@/utils';

export const extension = createExtension({
  id: 'dawg.explorer',
  global: {
    folders: {
      type: t.array(t.string),
      default: [],
    },
  },
  activate(context) {
    const folders = context.global.folders.value;

    context.subscriptions.push(commands.registerCommand({
      text: 'Open File Explorer',
      shortcut: ['CmdOrCtrl', 'E'],
      callback: () => {
        // This must match the tab name below
        dawg.ui.openedSideTab.value = 'Explorer';
      },
    }));

    const openFolder = () => {
      const { dialog } = remote;
      const toAdd = dialog.showOpenDialog({ properties: ['openDirectory'] });

      // We should only ever get undefined or an array of length 1
      if (!toAdd || toAdd.length === 0) {
        return;
      }


      const folder = toAdd[0];
      if (folders.indexOf(folder) !== -1) {
        return;
      }

      folders.push(folder);
    };

    const openSample = (sample: Sample) => {
      // FIXME(1) This should go in sample extension
      sampleViewer.openedSample.value = sample;
      dawg.ui.openedPanel.value = 'Sample';
    };

    const remove = (target: string) => {
      const i = folders.indexOf(target);
      if (i < 0) {
        return;
      }

      folders.splice(i, 1);
    };

    const component = vueExtend(createComponent({
      components: { FileExplorer },
      template: `
      <file-explorer
        :extensions="extensions"
        :folders="folders"
        @open-explorer="openFolder"
        @remove="remove"
      ></file-explorer>
      `,
      setup() {
        const loadMidi = async (path: string) => {
          const buffer = await fs.readFile(path);
          const ab = new ArrayBuffer(buffer.length);
          const view = new Uint8Array(ab);
          buffer.forEach((value, i) => {
            view[i] = value;
          });

          return parser.parse(ab, dawg.project.bpm.value);
        };

        const extensions: Extensions = {
          wav: {
            dragGroup: 'arranger',
            iconComponent: 'wav-icon',
            load: async (path: string) => {
              const buffer = await loadBuffer(path);
              const sample = Sample.create(path, buffer);
              return sample;
            },
            createTransferData: (sample: Sample) => {
              return ScheduledSample.create(sample);
            },
            preview: (sample: Sample) => {
              const result = sample.preview();
              if (result.started) {
                return result;
              }

              return {
                dispose: () => {
                  //
                },
              };
            },
            open: openSample,
          },
          mid: {
            dragGroup: 'midi',
            iconComponent: 'midi-icon',
            load: loadMidi,
          },
          midi: {
            dragGroup: 'midi',
            iconComponent: 'midi-icon',
            load: loadMidi,
          },
        };


        return {
          folders,
          openFolder,
          remove,
          extensions,
        };
      },
    }));

    dawg.ui.activityBar.push({
      icon: 'folder',
      name: 'Explorer',
      component,
    });

    const addFolder = dawg.commands.registerCommand({
      text: 'Add Folder to Workspace',
      callback: openFolder,
    });

    context.subscriptions.push(addFolder);
  },
});
