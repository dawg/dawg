import Vue from 'vue';
import { createComponent, computed, Wrapper, value } from 'vue-function-api';
import * as dawg from '@/dawg';
import { manager } from '../manager';

type Status = string | { text: string, value: string } | null;
const statusValue: Wrapper<Status> = value(null);

const component = Vue.extend(createComponent({
  template: `
  <span v-if="value === null">{{ status }}</span>
  <div v-else>
    <span>{{ status }}</span>
    <span style="margin: 0 5px">|</span>
    <span>{{ value }}</span>
  </div>
  `,
  setup() {
    return {
      status: computed(() => {
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

export const status = manager.activate({
  id: 'dawg.status',
  activate() {
    dawg.ui.statusBar.push({
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
