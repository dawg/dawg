export { notify } from '@/extensions/core/notify';
export { palette } from '@/extensions/core/palette';
export { commands } from '@/extensions/core/commands';
export { busy } from '@/extensions/core/busy';
export { theme } from '@/extensions/core/theme';
export { project } from '@/extensions/core/project';
export { menu, context } from '@/lib/framework';
export { instruments } from '@/extensions/core/instruments';
export { ui } from '@/lib/framework/ui';
export { pianoRoll } from '@/extensions/core/piano-roll';
export { patterns } from '@/extensions/core/patterns';
export { controls } from '@/extensions/core/controls';
export { menubar } from '@/extensions/core/menubar';
export { record } from '@/extensions/core/record';
export { status } from '@/extensions/core/status';
export { log } from '@/extensions/core/log';
export { playlist } from '@/extensions/core/playlist';
export { sampleViewer } from '@/extensions/core/sample-viewer';
export { window } from '@/extensions/core/window';
export { IExtensionContext, Extension, createExtension, Subscription } from '@/lib/framework/extensions';
export { manager } from '@/lib/framework/manager';
import * as io from '@/lib/io';

import * as platform from '@/lib/framework/platform';
import * as events from '@/lib/events';

export {
  io,
  events,
  platform,
};
