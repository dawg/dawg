import FileExplorer from '@/dawg/extensions/extra/explorer/FileExplorer.vue';
import * as dawg from '@/dawg';
import * as t from '@/modules/io';
import { remote } from 'electron';
import { Extensions, Folder } from '@/dawg/extensions/extra/explorer/types';
import { loadBuffer } from '@/modules/wav/local';
import parser from '@/midi-parser';
import fs from '@/fs';
import { ScheduledSample, Sample } from '@/core';
import { commands } from '@/dawg/extensions/core/commands';
import { createExtension } from '@/dawg/extensions';
import { createComponent, watch } from '@vue/composition-api';
import { vueExtend } from '@/utils';

let trees: Array<[string, Folder]> = [];
export const extension = createExtension({
  id: 'dawg.explorer',
  global: {
    folders: {
      type: t.array(t.type({ folder: t.string, openFolders: t.array(t.string) })),
      default: [],
    },
    selected: t.string,
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

      // Check if the folder already exists
      if (folders.find((f) => f.folder === folder)) {
        return;
      }

      folders.push({ folder, openFolders: [] });
    };

    const remove = (target: string) => {
      const targetInfo = folders.find((folder) => folder.folder === target);
      if (!targetInfo) {
        return;
      }

      const i = folders.indexOf(targetInfo); // 100% confidence that i > 0
      folders.splice(i, 1);
    };

    const component = vueExtend(createComponent({
      components: { FileExplorer },
      template: `
      <file-explorer
        :extensions="extensions"
        :folders="folders"
        :selected.sync="selected"
        @open-explorer="openFolder"
        @remove="remove"
        @update-trees="updateTrees"
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
          updateTrees: (newTrees: Array<[string, Folder]>) => {
            trees = newTrees;
          },
          folders,
          openFolder,
          remove,
          extensions,
          selected: context.global.selected,
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
  deactivate(context) {
    trees.forEach(([path, rootFolder]) => {
      const folderInfo = context.global.folders.value.find((folder) => folder.folder === path);
      if (!folderInfo) {
        // should never happen
        return;
      }

      folderInfo.openFolders = [];

      const recurse = (folder: Folder) => {
        if (folder.isExpanded.value) {
          folderInfo.openFolders.push(folder.path);
        }

        folder.children.forEach((child) => {
          if (child.type === 'file') {
            return;
          }

          recurse(child);
        });
      };

      recurse(rootFolder);
    });
  },
});
