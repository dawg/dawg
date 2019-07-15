import { ipcMain, ipcRenderer, Event } from 'electron';

type ElectronIpcMain = typeof ipcMain;
type ElectronIpcRenderer = typeof ipcRenderer;

interface EventInformation {
  [key: string]: any[];
}

type EventFunction<T extends EventInformation, K extends keyof T> = (event: Event, ...args: T[K]) => void;

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

export interface ElectronMenuAction {
  menu: string;
  label: string;
  accelerator?: string;
  uniqueEvent: string;
}

export interface ElectronMenuDivider {
  menu: string;
  label: null;
}

export type ElectronMenuItem = ElectronMenuAction | ElectronMenuDivider;

// We need to use a type and not an interface or else type inference won't work
// Honestly, I don't know why.
// tslint:disable-next-line:interface-over-type-literal
type IEvents = {
  addToMenu: [ElectronMenuItem | ElectronMenuItem[]];
  removeFromMenu: [ElectronMenuItem | ElectronMenuItem[]];
  removeMenu: [],
  showMenu: [],
};

export type IpcMain = IpcMainGeneric<IEvents>;
export type IpcRenderer = IpcRendererGeneric<IEvents>;
