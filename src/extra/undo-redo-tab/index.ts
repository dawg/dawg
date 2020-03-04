import * as dawg from '@/dawg';
import { createExtension } from '@/lib/framework/extensions';
import UndoRedo from '@/extra/undo-redo-tab/UndoRedo.vue';
import { VueConstructor } from 'vue';

export const extension = createExtension({
  id: 'dawg.undo-redo-tab',
  activate() {
    dawg.ui.activityBar.push({
      icon: 'undo',
      name: 'History',
      component: UndoRedo as VueConstructor<Vue>,
      order: 5,
    });
  },
});
