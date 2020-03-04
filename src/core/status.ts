import { createComponent, computed, ref } from '@vue/composition-api';
import * as framework from '@/lib/framework';
import Vue from 'vue';

export type Status = string | { text: string, value: string } | null;

export const status = framework.manager.activate({
  id: 'dawg.status',
  activate() {
    const statusValue = ref<Status>(null);

    const component = Vue.extend(createComponent({
      props: {},
      name: 'Status',
      template: `
      <span v-if="value === null">{{ statusValue }}</span>
      <div v-else class="text-sm">
        <span>{{ statusValue }}</span>
        <span style="margin: 0 -6px">|</span>
        <span>{{ value }}</span>
      </div>
      `,
      setup() {
        return {
          statusValue: computed(() => {
            if (!statusValue.value) {
              return '';
            } else if (typeof statusValue.value === 'string') {
              return statusValue;
            } else {
              return statusValue.value.text;
            }
          }),
          value: computed(() => {
            if (!statusValue.value) {
              return null;
            } else if (typeof statusValue.value === 'string') {
              return null;
            } else {
              return statusValue.value.value;
            }
          }),
        };
      },
    }));

    framework.ui.statusBar.push({
      component,
      position: 'left',
      order: 3,
    });

    return {
      set: (s: Status) => {
        statusValue.value = s;
      },
    };
  },
});
