// FIXME For some reason, it only works if I place this Vue.use statement here
import Vue from 'vue';
import VueCompositionApi from '@vue/composition-api';
Vue.use(VueCompositionApi);

import { VueConstructor } from 'vue';
import { Ref, ref } from '@vue/composition-api';

export interface TabAction {
  icon: Ref<string>;
  tooltip: Ref<string>;
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
  disabled?: Ref<boolean>;
  type: 'string';
  value: Ref<string | undefined>;
}

export interface SelectField {
  title: string;
  description: string;
  disabled?: Ref<boolean>;
  type: 'select';
  value: Ref<string | undefined>;
  options: string[];
}

export interface BooleanField {
  title: string;
  description: string;
  disabled?: Ref<boolean>;
  type: 'boolean';
  value: Ref<boolean>;
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
// TODO introduce order
const activityBar: ActivityBarItem[] = [];
const panels: PanelItem[] = [];
const mainSection: VueConstructor[] = [];
const toolbar: ToolbarItem[] = [];
const trackContext: Array<{ text: string; callback: (index: number) => void; }> = [];
const settings: Array<StringField | BooleanField | SelectField | VueConstructor> = [];
const openedSideTab = ref<undefined | string>(undefined);
const openedPanel = ref<undefined | string>(undefined);
const panelsSize = ref(250);
const sideBarSize = ref(250);

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

