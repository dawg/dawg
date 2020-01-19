import * as t from '@/modules/io';
import * as framework from '@/framework';
import { watch } from '@vue/composition-api';
import { createExtension } from '@/framework/extensions';

export const extension = createExtension({
  id: 'dawg.restorer',
  workspace: {
    openedSideTab: t.string,
    openedPanel: t.string,
    sideBarSize: {
      type: t.number,
      default: 250,
    },
    panelsSize: {
      type: t.number,
      default: 250,
    },
  },
  activate(context) {
    console.log('SETTING', framework.ui.sideBarSize.value, context.workspace.sideBarSize.value);
    framework.ui.sideBarSize.value = context.workspace.sideBarSize.value;
    framework.ui.panelsSize.value = context.workspace.panelsSize.value;

    // watch everything for changes
    watch(framework.ui.openedSideTab, () => {
      if (framework.ui.openedSideTab.value) {
        context.workspace.openedSideTab.value = framework.ui.openedSideTab.value;
      }
    });

    watch(framework.ui.openedPanel, () => {
      if (framework.ui.openedPanel.value) {
        context.workspace.openedPanel.value = framework.ui.openedPanel.value;
      }
    });

    watch(framework.ui.sideBarSize, () => {
      console.log('SETTING', framework.ui.sideBarSize.value);
      if (framework.ui.sideBarSize.value) {
        context.workspace.sideBarSize.value = framework.ui.sideBarSize.value;
      }
    });

    watch(framework.ui.panelsSize, () => {
      if (framework.ui.panelsSize.value) {
        context.workspace.panelsSize.value = framework.ui.panelsSize.value;
      }
    });

    // initialize the variables
    framework.ui.openedSideTab.value = context.workspace.openedSideTab.value;
    framework.ui.openedPanel.value = context.workspace.openedPanel.value;
  },
});
