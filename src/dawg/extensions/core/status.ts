import Vue from 'vue';
import { createComponent, computed } from 'vue-function-api';
import { manager } from '@/base/manager';
import * as base from '@/base';

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
        if (!base.status.value) {
          return '';
        } else if (typeof base.status.value === 'string') {
          return base.status;
        } else {
          return base.status.value.text;
        }
      }),
      value: computed(() => {
        if (!base.status.value) {
          return null;
        } else if (typeof base.status.value === 'string') {
          return null;
        } else {
          return base.status.value.value;
        }
      }),
    };
  },
}));

export const status = manager.activate({
  id: 'dawg.status',
  activate() {
    base.ui.statusBar.push({
      component,
      position: 'left',
      order: 3,
    });

    return {
      set: (s: base.Status) => {
        base.status.value = s;
      },
    };
  },
});
