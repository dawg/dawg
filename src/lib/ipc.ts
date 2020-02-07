import { ipcMain as ipcM, ipcRenderer as ipcR, Event, WebContents } from 'electron';
import { keys } from './std';

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
  on<K extends keyof T & string>(channel: K, listener: EventFunction<T, K, V>): this;
  once<K extends keyof T & string>(channel: K, listener: EventFunction<T, K, V>): this;
  removeAllListeners<K extends keyof T & string>(channel: K): this;
  removeListener<K extends keyof T & string>(channel: K, listener: EventFunction<T, K, V>): this;
}

interface IpcRendererGeneric<T extends EventInformation, V extends EventInformation> extends ElectronIpcRenderer {
  on<K extends keyof T & string>(channel: K, listener: EventFunction<T, K, V>): this;
  removeListener<K extends keyof T & string>(channel: K, listener: EventFunction<T, K, V>): this;
  send<K extends keyof V & string>(channel: K, ...args: V[K]): void;
}

type Listeners<T extends EventInformation, V extends EventInformation> = { [K in keyof T]: EventFunction<T, K, V> };

export const defaultIpcRenderer = <A extends EventInformation, B extends EventInformation>(
  events: Listeners<A, B>,
) => {
  // RendererEvents, MainEvents
  const ipcRenderer: IpcRendererGeneric<A, B> = ipcR;

  keys(events).forEach((key) => {
    ipcRenderer.on(key, events[key] as any);
  });

  return {
    send: <K extends keyof B & string>(channel: K, ...args: B[K]) => {
      ipcRenderer.send(channel, ...args);
    },
  };
};

export const defaultIpcMain = <A extends EventInformation, B extends EventInformation>(
  events: Listeners<A, B>,
) => {
  // MainEvents, RendererEvents
  const ipcMain: IpcMainGeneric<A, B> = ipcM;

  keys(events).forEach((key) => {
    ipcMain.on(key, events[key] as any);
  });
};
