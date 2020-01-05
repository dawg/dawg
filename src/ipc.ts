import { ipcMain as ipcM, ipcRenderer as ipcR, Event, WebContents } from 'electron';
import { Key } from './keyboard';

// This is duplication but we can't import utils here
export const keys = <O>(o: O): Array<keyof O & string> => {
  return Object.keys(o) as Array<keyof O & string>;
};

type ElectronIpcMain = typeof ipcM;
type ElectronIpcRenderer = typeof ipcR;

interface EventInformation {
  [key: string]: any[];
}

interface ElectronWebContents<T extends EventInformation> extends WebContents {
  send<K extends keyof T>(channel: K, ...args: T[K]): void;
}

interface ElectronEvent<T extends EventInformation> extends Event {
  sender: ElectronWebContents<T>;
}

type EventFunction<
  T extends EventInformation,
  K extends keyof T,
  V extends EventInformation,
> = (event: ElectronEvent<V>, ...args: T[K]) => void;

interface IpcMainGeneric<T extends EventInformation, V extends EventInformation> extends ElectronIpcMain {
  on<K extends keyof T>(channel: K, listener: EventFunction<T, K, V>): this;
  // once<K extends keyof T>(channel: K, listener: EventFunction<T, K>): this;
  // removeAllListeners<K extends keyof T>(channel: K): this;
  // removeListener<K extends keyof T>(channel: K, listener: EventFunction<T, K>): this;
}

interface IpcRendererGeneric<T extends EventInformation, V extends EventInformation> extends ElectronIpcRenderer {
  on<K extends keyof T>(channel: K, listener: EventFunction<T, K, V>): this;
  // once<K extends keyof T>(channel: K, listener: EventFunction<T, K>): this;
  // removeAllListeners<K extends keyof T>(channel: K): this;
  // removeListener<K extends keyof T>(channel: K, listener: EventFunction<T, K>): this;
  send<K extends keyof V>(channel: K, ...args: V[K]): void;
  // sendSync<K extends keyof T>(channel: K, ...args: T[K]): any;
  // sendTo<K extends keyof T>(webContentsId: number, channel: K, ...args: T[K]): void;
  // sendToHost<K extends keyof T>(channel: K, ...args: T[K]): void;
}

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
type MainEvents = {
  addToMenuBar: [ElectronMenuBarItem | ElectronMenuBarItem[]];
  removeFromMenuBar: [ElectronMenuBarItem | ElectronMenuBarItem[]];
  defineMenu: [{ menu: string, order: number }];
  showMenu: [ElectronMenuOptions];
};

// tslint:disable-next-line:interface-over-type-literal
type RendererEvents = {
  closeMenu: [ElectronMenuOptions];
  menuCallback: [string];
  menuBarCallback: [string];
};

export type IpcMain = IpcMainGeneric<MainEvents, RendererEvents>;
export type IpcRenderer = IpcRendererGeneric<RendererEvents, MainEvents>;

// This is exported since we need to "send" events
export const ipcRenderer: IpcRenderer = ipcR;
const ipcMain: IpcMain = ipcM;

type Listeners<T extends EventInformation, V extends EventInformation> = { [K in keyof T]: EventFunction<T, K, V> };

export const defaultIpcRenderer = (events: Listeners<RendererEvents, MainEvents>) => {
  keys(events).forEach((key) => {
    ipcRenderer.on(key, events[key] as any);
  });
};

export const defaultIpcMain = (events: Listeners<MainEvents, RendererEvents>) => {
  keys(events).forEach((key) => {
    ipcMain.on(key, events[key] as any);
  });
};
