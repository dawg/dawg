// FIXME For some reason, it only works if I place this Vue.use statement here
import Vue from 'vue';
import VueCompositionApi from '@vue/composition-api';
Vue.use(VueCompositionApi);

import { VueConstructor } from 'vue';
import { Ref, ref, createComponent } from '@vue/composition-api';

export interface TabAction {
  // FIXME make all of these optionally refs
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
  order?: number;
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

interface StatusBarItem {
  component: VueConstructor;
  position: 'right' | 'left';
  order?: number;
}

const TOOLBAR_SIZE = 64;
const STATUS_BAR_SIZE = 25;
const PANEL_HEADERS_SIZE = 55;
const ACTIVITY_BAR_SIZE = 65;
const INITIAL_PANELS_SIZE = 250;
const INITIAL_SIDE_BAR_SIZE = 250;

const global: Array<VueConstructor | ReturnType<typeof createComponent>> = [];
const statusBar: StatusBarItem[] = [];
const activityBar: ActivityBarItem[] = [];
const panels: PanelItem[] = [];
const mainSection: VueConstructor[] = [];
const toolbar: ToolbarItem[] = [];
const trackContext: Array<{ text: string; callback: (index: number) => void; }> = [];
const openedSideTab = ref<undefined | string>(undefined);
const openedPanel = ref<undefined | string>(undefined);
const panelsSize = ref(INITIAL_PANELS_SIZE);
const sideBarSize = ref(INITIAL_SIDE_BAR_SIZE);
const panelsCollapsed = ref(false);
const sideBarCollapsed = ref(false);
const rootClasses: string[] = [];

export const ui = {
  TOOLBAR_SIZE,
  STATUS_BAR_SIZE,
  PANEL_HEADERS_SIZE,
  ACTIVITY_BAR_SIZE,
  global,
  trackContext,
  statusBar,
  activityBar,
  panels,
  mainSection,
  toolbar,
  openedSideTab,
  openedPanel,
  panelsSize,
  sideBarSize,
  rootClasses,
  panelsCollapsed,
  sideBarCollapsed,
};

