import { ipcMain as ipcM, ipcRenderer as ipcR, Event, WebContents } from 'electron';
import { keys } from './std';

type ElectronIpcMain = typeof ipcM;
type ElectronIpcRenderer = typeof ipcR;

// This interface is not exported :(
interface IpcMainEvent<T extends EventInformation> extends Event {
  frameId: number;
  reply: () => void;
  returnValue: any;
  sender: ElectronWebContents<T>;
}

interface IpcRendererEvent<T extends EventInformation> extends Event {
  sender: ElectronIpcRenderer;
  senderId: number;
}

interface EventInformation {
  [key: string]: any[];
}

interface ElectronWebContents<T extends EventInformation> extends WebContents {
  send<K extends keyof T>(channel: K, ...args: T[K]): void;
}

type RendererFunction<
  T extends EventInformation,
  K extends keyof T,
  V extends EventInformation,
> = (event: IpcRendererEvent<V>, ...args: T[K]) => void;

type MainFunction<
  T extends EventInformation,
  K extends keyof T,
  V extends EventInformation,
> = (event: IpcMainEvent<V>, ...args: T[K]) => void;

interface IpcMainGeneric<
  T extends EventInformation,
  V extends EventInformation,
> extends ElectronIpcMain {
  on<K extends keyof T & string>(channel: K, listener: MainFunction<T, K, V>): this;
  once<K extends keyof T & string>(channel: K, listener: MainFunction<T, K, V>): this;
  removeAllListeners<K extends keyof T & string>(channel: K): this;
  removeListener<K extends keyof T & string>(channel: K, listener: MainFunction<T, K, V>): this;
}

interface IpcRendererGeneric<
  T extends EventInformation,
  V extends EventInformation,
> extends ElectronIpcRenderer {
  on<K extends keyof T & string>(channel: K, listener: RendererFunction<T, K, V>): this;
  removeListener<K extends keyof T & string>(channel: K, listener: RendererFunction<T, K, V>): this;
  send<K extends keyof V & string>(channel: K, ...args: V[K]): void;
}

type MainListeners<T extends EventInformation, V extends EventInformation> = {
  [K in keyof T]: MainFunction<T, K, V>
};

type RendererListeners<T extends EventInformation, V extends EventInformation> = {
  [K in keyof T]: RendererFunction<T, K, V>
};

export const defaultIpcRenderer = <A extends EventInformation, B extends EventInformation>(
  events: RendererListeners<A, B>,
) => {
  // RendererEvents, MainEvents
  const ipcRenderer = ipcR as IpcRendererGeneric<A, B>;

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
  events: MainListeners<A, B>,
) => {
  // MainEvents, RendererEvents
  const ipcMain = ipcM as IpcMainGeneric<A, B>;

  keys(events).forEach((key) => {
    ipcMain.on(key, events[key] as any);
  });
};
