import { Bus } from '@/modules/update';

export interface FileTree {
  [fullPath: string]: FileTree | string;
}

export type Extension = 'wav' | 'midi' | 'mid';
export interface ExtensionData<T, V = T> {
  /**
   * The drag group. This must match the desired acceptor.
   */
  dragGroup: string;
  load: (path: string) => T | Promise<T>;
  iconComponent: string;
  createTransferData?: (item: T) => V;
  preview?: (item: T) => void;
  stopPreview?: (item: T) => void;
  open?: (item: T) => void;
}

export interface Extensions {
  [k: string]: ExtensionData<any, any>;
}

export type EventBus = Bus<{ up: [KeyboardEvent], down: [KeyboardEvent], dblclick: [MouseEvent] }>;
