import { MenuItemConstructorOptions } from 'electron';

export interface MenuBarSections {
  Application: '0_commands';
  File: '0_newOpen' | '1_save' | '2_exportImport';
  Edit: '0_undoRedo' | '1_cutCopyPaste';
  View: '0_view';
  Help: '0_links' | '1_tools';
}

// Can be used in either the menu bar or the context menu
export type MenuItem = {
  type: 'callback';
  label: string;
  accelerator?: string;
  uniqueEvent: string;
} | {
  type: 'role'
  label: string;
  accelerator?: string;
  role: MenuItemConstructorOptions['role'];
};

export type MenuBarItem<K extends keyof MenuBarSections> = MenuItem & {
  menu: K;
  section: MenuBarSections[K];
};

export interface ElectronMenuPosition {
  x: number;
  y: number;
}

export interface ElectronMenuOptions {
  items: Array<MenuItem | null>;
  left?: boolean;
}

// We need to use a type and not an interface or else type inference won't work
// Honestly, I don't know why.
// tslint:disable-next-line:interface-over-type-literal
export type MainEvents = {
  addToMenuBar: [MenuBarItem<keyof MenuBarSections>];
  removeFromMenuBar: [MenuBarItem<keyof MenuBarSections>];
  showMenu: [ElectronMenuOptions];
};

// tslint:disable-next-line:interface-over-type-literal
export type RendererEvents = {
  closeMenu: [ElectronMenuOptions];
  menuCallback: [string];
  menuBarCallback: [string];
};
