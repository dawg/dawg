import { ipcMain as ipcM, ipcRenderer as ipcR, Event, WebContents } from 'electron';

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

type EventFunction<T extends EventInformation, K extends keyof T> = (event: ElectronEvent<T>, ...args: T[K]) => void;

interface IpcMainGeneric<T extends EventInformation> extends ElectronIpcMain {
  on<K extends keyof T>(channel: K, listener: EventFunction<T, K>): this;
  once<K extends keyof T>(channel: K, listener: EventFunction<T, K>): this;
  removeAllListeners<K extends keyof T>(channel: K): this;
  removeListener<K extends keyof T>(channel: K, listener: EventFunction<T, K>): this;
}

interface IpcRendererGeneric<T extends EventInformation> extends ElectronIpcRenderer {
  on<K extends keyof T>(channel: K, listener: EventFunction<T, K>): this;
  once<K extends keyof T>(channel: K, listener: EventFunction<T, K>): this;
  removeAllListeners<K extends keyof T>(channel: K): this;
  removeListener<K extends keyof T>(channel: K, listener: EventFunction<T, K>): this;
  send<K extends keyof T>(channel: K, ...args: T[K]): void;
  sendSync<K extends keyof T>(channel: K, ...args: T[K]): any;
  sendTo<K extends keyof T>(webContentsId: number, channel: K, ...args: T[K]): void;
  sendToHost<K extends keyof T>(channel: K, ...args: T[K]): void;
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
type IEvents = {
  addToMenuBar: [ElectronMenuBarItem | ElectronMenuBarItem[]];
  removeFromMenuBar: [ElectronMenuBarItem | ElectronMenuBarItem[]];
  menuBarCallback: [string];
  defineMenu: [{ menu: string, order: number }];
  showMenu: [ElectronMenuOptions];
  closeMenu: [ElectronMenuOptions];
  menuCallback: [string];
};

export type IpcMain = IpcMainGeneric<IEvents>;
export type IpcRenderer = IpcRendererGeneric<IEvents>;

export const ipcRenderer: IpcRenderer = ipcR;
export const ipcMain: IpcMain = ipcM;
