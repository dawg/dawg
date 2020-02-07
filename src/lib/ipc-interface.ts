export interface ElectronMenuItem {
  label: string;
  accelerator?: string;
  uniqueEvent: string;
}

export interface ElectronMenuBarAction extends ElectronMenuItem {
  menu: string;
}

export interface ElectronMenuBarDivider {
  menu: string;
  label: null;
}

export type ElectronMenuBarItem = ElectronMenuBarAction | ElectronMenuBarDivider;

export interface ElectronMenuPosition {
  x: number;
  y: number;
}

export interface ElectronMenuOptions {
  items: Array<ElectronMenuItem | null>;
  left?: boolean;
}

// We need to use a type and not an interface or else type inference won't work
// Honestly, I don't know why.
// tslint:disable-next-line:interface-over-type-literal
export type MainEvents = {
  addToMenuBar: [ElectronMenuBarItem | ElectronMenuBarItem[]];
  removeFromMenuBar: [ElectronMenuBarItem | ElectronMenuBarItem[]];
  defineMenu: [{ menu: string, order: number }];
  showMenu: [ElectronMenuOptions];
};

// tslint:disable-next-line:interface-over-type-literal
export type RendererEvents = {
  closeMenu: [ElectronMenuOptions];
  menuCallback: [string];
  menuBarCallback: [string];
};
