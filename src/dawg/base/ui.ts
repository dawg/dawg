import { VueConstructor } from 'vue';
import { Wrapper } from 'vue-function-api';
import { DawgCommand } from '@/dawg/commands';

export type ClickCommand = DawgCommand<[MouseEvent]>;

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

// FIXME(1) add function and that return a dispose function
// This should be added to the base later
interface UI {
  global: VueConstructor[];
  statusBar: StatusBarItem[];
  activityBar: ActivityBarItem[];
  panels: PanelItem[];
  mainSection: VueConstructor[];
  toolbar: ToolbarItem[];
  trackContext: Array<DawgCommand<[number]>>;
  settings: Array<StringField | BooleanField | SelectField | VueConstructor>;
}

export const ui: UI = {
  global: [],
  trackContext: [],
  statusBar: [],
  activityBar: [],
  panels: [],
  mainSection: [],
  toolbar: [],
  settings: [],
};
