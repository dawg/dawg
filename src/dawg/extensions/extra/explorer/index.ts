import * as dawg from '@/dawg';
import SmartFileExplorer from '@/dawg/extensions/extra/explorer/SmartFileExplorer.vue';
import Vue from 'vue';
import { remote } from 'electron';
import { Sample } from '@/core';
import { commands } from '@/dawg/extensions/core/commands';
import { panels } from '@/dawg/extensions/core/panels';

export const extension: dawg.Extension<{}, { folders: string[] }> = {
  id: 'dawg.explorer',

  activate(context) {
    const folders = context.global.get('folders', []);

    context.subscriptions.push(commands.registerCommand({
      text: 'Open File Explorer',
      shortcut: ['CmdOrCtrl', 'E'],
      callback: () => {
        // This must match the tab name below
        dawg.activityBar.openedSideTab.value = 'Explorer';
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

      // FIXME
      // the showFileDialog messes with the keyup events
      // This is a temporary solution
      dawg.commands.clear();
    };

    const openSample = (sample: Sample) => {
      // TODO(jacob)
      // general.setSample(sample);
      panels.openedPanel.value = 'Sample';
    };

    const remove = (target: string) => {
      const i = folders.indexOf(target);
      if (i < 0) {
        return;
      }

      folders.splice(i, 1);
    };

    const options = {
      components: { SmartFileExplorer },
      template: `
      <smart-file-explorer
        :folders="folders"
        @open-explorer="openFolder"
        @open-sample="openSample"
        @remove="remove"
      ></smart-file-explorer>
      `,
      data() {
        return {
          folders,
          openFolder,
          openSample,
          remove,
        };
      },
    };

    const wrapper = Vue.extend(options);

    dawg.ui.activityBar.push({
      icon: 'folder',
      name: 'Explorer',
      component: wrapper,
    });

    const addFolder = dawg.commands.registerCommand({
      text: 'Add Folder to Workspace',
      callback: openFolder,
    });

    context.subscriptions.push(addFolder);
  },
};
