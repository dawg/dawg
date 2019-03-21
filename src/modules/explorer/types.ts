import { Bus } from '../update';

export interface FileTree {
  [fullPath: string]: FileTree | string;
}

export type Playable = 'wav';
export type Extension = Playable | 'midi' | 'mid';
export interface ExtensionData<T, V> {
  dragGroup: string;
  load: (path: string) => T;
  createTransferData: (item: T) => V;
  preview: (item: T) => void;
  stopPreview: (item: T) => void;
}

export interface Extensions {
  [k: string]: ExtensionData<any, any>;
}

export type EventBus = Bus<{ up: [KeyboardEvent], down: [KeyboardEvent], dblclick: [MouseEvent] }>;
