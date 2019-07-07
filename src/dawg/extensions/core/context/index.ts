import { manager } from '@/dawg/extensions/manager';
import ContextMenu from '@/dawg/extensions/core/context/ContextMenu.vue';
import bus, { isMouseEvent, ContextPayload } from '@/dawg/extensions/core/context/bus';
import { remote } from 'electron';
import { ui } from '@/dawg/ui';

type ContextFunction = (opts: ContextPayload) => void;

const inspect = {
  text: 'Inspect',
  callback: (e: MouseEvent) => {
    // Wait for context menu to close before opening the Dev Tools!
    // If you don't, it will focus on the context menu.
    setTimeout(() => {
      const window = remote.getCurrentWindow();
      window.webContents.inspectElement(e.x, e.y);
      if (window.webContents.isDevToolsOpened()) {
        window.webContents.devToolsWebContents.focus();
      }
    }, 1000);
  },
};

export const context = manager.activate({
  id: 'dawg.context',
  activate() {
    const defaultItems =  process.env.NODE_ENV !== 'production' ? [inspect] : [];

    const contextFunction: ContextFunction = (opts) => {
      if (isMouseEvent(opts.event)) {
        opts.event.preventDefault();
        opts.event.stopPropagation();
      }

      bus.$emit('show', { ...opts, items: [...opts.items, null, ...defaultItems] });
    };

    const menuFunction: ContextFunction = (opts) => {
      if (isMouseEvent(opts.event)) {
        opts.event.stopPropagation();
      }
      bus.$emit('show', opts);
    };

    ui.global.push(ContextMenu);

    return {
      context: contextFunction,
      menu: menuFunction,
    };
  },
});
