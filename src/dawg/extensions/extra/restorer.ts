import * as t from '@/modules/io';
import { ui } from '@/base/ui';
import { watch } from '@vue/composition-api';
import { createExtension } from '@/dawg/extensions';

export const extension = createExtension({
  id: 'dawg.restorer',
  workspace: {
    openedSideTab: t.string,
    openedPanel: t.string,
    sideBarSize: {
      type: t.number,
      default: 250,
      expose: false,
    },
    panelsSize: {
      type: t.number,
      default: 250,
      expose: false,
    },
  },
  activate(context) {
    // watch everything for changes
    watch(ui.openedSideTab, () => {
      if (ui.openedSideTab.value) {
        context.workspace.openedSideTab.value = ui.openedSideTab.value;
      }
    });

    watch(ui.openedPanel, () => {
      if (ui.openedPanel.value) {
        context.workspace.openedPanel.value = ui.openedPanel.value;
      }
    });

    watch(ui.sideBarSize, () => {
      if (ui.sideBarSize.value) {
        context.workspace.sideBarSize.value = ui.sideBarSize.value;
      }
    });

    watch(ui.panelsSize, () => {
      if (ui.panelsSize.value) {
        context.workspace.panelsSize.value = ui.panelsSize.value;
      }
    });

    // initialize the variables
    ui.openedSideTab.value = context.workspace.openedSideTab.value;
    ui.openedPanel.value = context.workspace.openedPanel.value;
    ui.sideBarSize.value = context.workspace.sideBarSize.value;
    ui.panelsSize.value = context.workspace.panelsSize.value;
  },
});
