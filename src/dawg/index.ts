export { notify } from '@/dawg/extensions/core/notify';
export { palette } from '@/dawg/extensions/core/palette';
export { commands } from '@/dawg/extensions/core/commands';
export { busy } from '@/dawg/extensions/core/busy';
export { theme } from '@/dawg/extensions/core/theme';
export { project } from '@/dawg/extensions/core/project';
export { menu, context } from '@/base';
export { instruments } from '@/dawg/extensions/core/instruments';
export { ui } from '@/base/ui';
export { pianoRoll } from '@/dawg/extensions/core/piano-roll';
export { patterns } from '@/dawg/extensions/core/patterns';
export { controls } from '@/dawg/extensions/core/controls';
export { menubar } from '@/dawg/extensions/core/menubar';
export { record } from '@/dawg/extensions/core/record';
export { status } from '@/dawg/extensions/core/status';
export { log } from '@/dawg/extensions/core/log';
export { playlist } from '@/dawg/extensions/core/playlist';
export { sampleViewer } from '@/dawg/extensions/core/sample-viewer';
export { window } from '@/dawg/extensions/core/window';
export { IExtensionContext, Extension, createExtension, Subscription } from '@/dawg/extensions';
export { manager } from '@/base/manager';
export { Key } from '@/keyboard';
import * as io from '@/modules/io';

import * as platform from '@/platform';
import * as events from '@/events';

export {
  io,
  events,
  platform,
};
