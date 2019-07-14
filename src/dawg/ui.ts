import { VueConstructor } from 'vue';
import { Wrapper } from 'vue-function-api';

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
  order?: number;
}

export interface StringField {
  title: string;
  description: string;
  disabled?: Wrapper<boolean>;
  type: 'string';
  value: Wrapper<string | undefined>;
}

export interface SelectField {
  title: string;
  description: string;
  disabled?: Wrapper<boolean>;
  type: 'select';
  value: Wrapper<string | undefined>;
  options: string[];
}

export interface BooleanField {
  title: string;
  description: string;
  disabled?: Wrapper<boolean>;
  type: 'boolean';
  value: Wrapper<boolean>;
}

interface StatusBarItem {
  component: VueConstructor;
  position: 'right' | 'left';
  order?: number;
}

interface UI {
  global: VueConstructor[];
  statusBar: StatusBarItem[];
  activityBar: ActivityBarItem[];
  panels: PanelItem[];
  // TODO This will eventually be used for the settings.
  // You will be able to push and then remove when finished.
  // We shoud add functions instead of allowing elements to interact directly with the arrays.
  mainSection: VueConstructor[];
  toolbar: ToolbarItem[];
  settings: Array<StringField | BooleanField | SelectField | VueConstructor>;
}

export const ui: UI = {
  global: [],
  statusBar: [],
  activityBar: [],
  panels: [],
  mainSection: [],
  toolbar: [],
  settings: [],
};
