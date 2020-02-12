export { notify } from '@/core/notify';
export { palette } from '@/core/palette';
export { commands } from '@/core/commands';
export { busy } from '@/core/busy';
export { theme } from '@/core/theme';
export { project } from '@/core/project';
export { menu, context } from '@/lib/framework';
export { instruments } from '@/core/instruments';
export { ui } from '@/lib/framework/ui';
export { pianoRoll } from '@/core/piano-roll';
export { patterns } from '@/core/patterns';
export { controls } from '@/core/controls';
export { menubar } from '@/core/menubar';
export { record } from '@/core/record';
export { status } from '@/core/status';
export { log } from '@/core/log';
export { playlist } from '@/core/playlist';
export { sampleViewer } from '@/core/sample-viewer';
export { window } from '@/core/window';
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
