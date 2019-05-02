import { VueConstructor } from 'vue';

class StatusBarItem {
  public text = '';
  public tooltip = '';

  public dispose() {
    //
  }
}

export enum StatusBarAlignment {
  Left,
  Right,
}

interface StatusBarItemElement {
  type: 'item';
  element: StatusBarItem;
  alignment?: StatusBarAlignment;
  priority?: number;
}

interface StatusBarVueElement {
  type: 'vue';
  element: VueConstructor;
  alignment?: StatusBarAlignment;
  priority?: number;
}

type StatusBarElement = StatusBarItemElement | StatusBarVueElement;

const statusBarElements: StatusBarElement[] = [];

interface UI {
  global: VueConstructor[];
  statusBarLeft: VueConstructor[];
  statusBarRight: VueConstructor[];
  createStatusBarItem: () => StatusBarItem;
}

export const ui: UI = {
  global: [],
  statusBarLeft: [],
  statusBarRight: [],
  createStatusBarItem(alignment?: StatusBarAlignment, priority?: number) {
    const statusBarItem = new StatusBarItem();
    statusBarElements.push({
      type: 'item',
      element: statusBarItem,
      alignment,
      priority,
    });

    return statusBarItem;
  },
};
