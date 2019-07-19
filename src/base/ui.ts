// FIXME For some reason, it only works if I place this Vue.use statement here
import Vue from 'vue';
import { plugin } from 'vue-function-api';
Vue.use(plugin);

import { VueConstructor } from 'vue';
import { Wrapper, value } from 'vue-function-api';
import { DawgCommand } from '@/dawg/commands';

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
const global: VueConstructor[] = [];
const statusBar: StatusBarItem[] = [];
const activityBar: ActivityBarItem[] = [];
const panels: PanelItem[] = [];
const mainSection: VueConstructor[] = [];
const toolbar: ToolbarItem[] = [];
const trackContext: Array<DawgCommand<[number]>> = [];
const settings: Array<StringField | BooleanField | SelectField | VueConstructor> = [];
const openedSideTab = value<undefined | string>(undefined);
const openedPanel = value<undefined | string>(undefined);
const panelsSize = value(250);
const sideBarSize = value(250);

export const ui = {
  global,
  trackContext,
  statusBar,
  activityBar,
  panels,
  mainSection,
  toolbar,
  settings,
  openedSideTab,
  openedPanel,
  panelsSize,
  sideBarSize,
};

