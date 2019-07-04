import Vue from 'vue';
import { plugin } from 'vue-function-api';
Vue.use(plugin);

export { notify } from '@/dawg/extensions/core/notify';
export { palette } from '@/dawg/extensions/core/palette';
export { commands } from '@/dawg/extensions/core/commands';
export { activityBar } from '@/dawg/extensions/core/activity-bar';
export { busy } from '@/dawg/extensions/core/busy';
export { theme } from '@/dawg/extensions/core/theme';
export { project } from '@/dawg/extensions/core/project';
export { ui } from '@/dawg/ui';
export { Key, Command } from '@/dawg/extensions/core/commands';
export { IExtensionContext, Extension } from '@/dawg/extensions';
export { manager } from '@/dawg/extensions/manager';

import * as platform from '@/dawg/platform';
import * as events from '@/dawg/events';

export {
  events,
  platform,
};
