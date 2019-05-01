import { VueConstructor } from 'vue';

interface UI {
  global: VueConstructor[];
  statusBarLeft: VueConstructor[];
  statusBarRight: VueConstructor[];
}

export const ui: UI = {
  global: [],
  statusBarLeft: [],
  statusBarRight: [],
};
