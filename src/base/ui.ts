import { VueConstructor } from 'vue';
import { Wrapper } from 'vue-function-api';
import { DawgCommand } from '@/dawg/commands';
import { emitter } from '@/dawg/events';

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
const global: VueConstructor[] = [];
const statusBar: StatusBarItem[] = [];
const activityBar: ActivityBarItem[] = [];
const panels: PanelItem[] = [];
const mainSection: VueConstructor[] = [];
const toolbar: ToolbarItem[] = [];
const trackContext: Array<DawgCommand<[number]>> = [];
const settings: Array<StringField | BooleanField | SelectField | VueConstructor> = [];

const events = emitter<{ clickActivityBarItem: (item: ActivityBarItem) => void }>();

export const ui = {
  global,
  trackContext,
  statusBar,
  activityBar,
  panels,
  mainSection,
  toolbar,
  settings,
};

export const onDidClickActivityBarItem = (listener: (item: ActivityBarItem) => void) => {
  events.addListener('clickActivityBarItem', listener);
  return {
    dispose() {
      events.removeListener('clickActivityBarItem', listener);
    },
  };
};

export const clickActivityBarItem = (item: ActivityBarItem) => {
  events.emit('clickActivityBarItem', item);
};
