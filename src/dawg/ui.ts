import { VueConstructor } from 'vue';
import { Wrapper } from 'vue-function-api';

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

export interface TabAction {
  icon: Wrapper<string>;
  tooltip: Wrapper<string>;
  callback: (e: MouseEvent) => void;
  props?: { [k: string]: string };
}

export interface ActivityBarItem {
  icon: string;
  iconProps?: { [k: string]: string };
  name: string;
  component: VueConstructor;
  actions?: TabAction[];
}

export interface PanelItem {
  name: string;
  component: VueConstructor;
  actions?: TabAction[];
}

export interface ToolbarItem {
  component: VueConstructor;
  position: 'right' | 'left';
}

export interface StringField {
  title: string;
  description: string;
  disabled?: Wrapper<boolean>;
  type: 'string';
  value: Wrapper<string>;
}

export interface SelectField {
  title: string;
  description: string;
  disabled?: Wrapper<boolean>;
  type: 'select';
  value: Wrapper<string>;
  options: string[];
}

export interface BooleanField {
  title: string;
  description: string;
  disabled?: Wrapper<boolean>;
  type: 'boolean';
  value: Wrapper<boolean>;
}

type StatusBarElement = StatusBarItemElement | StatusBarVueElement;

const statusBarElements: StatusBarElement[] = [];

interface UI {
  global: VueConstructor[];
  statusBarLeft: VueConstructor[];
  statusBarRight: VueConstructor[];
  activityBar: ActivityBarItem[];
  panels: PanelItem[];
  // TODO This will eventually be used for the settings.
  // You will be able to push and then remove when finished.
  // We shoud add functions instead of allowing elements to interact directly with the arrays.
  mainSection: VueConstructor[];
  toolbar: ToolbarItem[];
  settings: Array<StringField | BooleanField | SelectField | VueConstructor>;
  createStatusBarItem: () => StatusBarItem;
}

export const ui: UI = {
  global: [],
  statusBarLeft: [],
  statusBarRight: [],
  activityBar: [],
  panels: [],
  mainSection: [],
  toolbar: [],
  settings: [],
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
