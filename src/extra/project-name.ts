import Vue from 'vue';
import { createExtension } from '@/lib/framework/extensions';
import * as dawg from '@/dawg';
import path from 'path';
import { computed, ref } from '@vue/composition-api';
import * as oly from '@/lib/olyger';

export const extension = createExtension({
  id: 'dawg.project-name',
  activate(context) {
    const openedFile = ref(dawg.project.getOpenedFile());
    dawg.project.onDidSetOpenedFile(() => {
      openedFile.value = dawg.project.getOpenedFile();
    });

    const projectName = computed(() => {
      return openedFile.value === null ? '' : path.basename(openedFile.value).split('.')[0];
    });

    const hasUnsavedChanged = ref(false);
    context.subscriptions.push(oly.onDidStateChange((value) => {
      hasUnsavedChanged.value = value === 'unsaved';
    }));

    const title = computed(() => {
      if (hasUnsavedChanged.value) {
        if (openedFile.value) {
          return openedFile.value + ' (Unsaved Changes)';
        } else {
          return 'Unsaved Changes';
        }

      } else {
        return openedFile.value;
      }
    });

    const text = computed(() => {
      if (hasUnsavedChanged.value) {
        return '*' + projectName.value;
      } else {
        return projectName.value;
      }
    });

    const component = Vue.extend({
      template: `
        <div :title="title.value" class="text-default text-sm">
          {{ text.value }}
        </div>
      `,
      data: () => ({
        text,
        title,
      }),
    });

    dawg.ui.statusBar.push({
      component,
      position: 'left',
      order: 1,
    });
  },
});
