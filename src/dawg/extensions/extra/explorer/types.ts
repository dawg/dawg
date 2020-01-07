import { Ref } from '@vue/composition-api';

export interface File {
  type: 'file';
  parent: Folder | null;
  index: number;
  path: string;
  isSelected: Ref<boolean>;
  value: string;
}

export type Folders = Array<{ folder: string, openFolders: string[] }>;

export interface Folder {
  type: 'folder';
  parent: Folder | null;
  index: number;
  path: string;
  isExpanded: Ref<boolean>;
  isSelected: Ref<boolean>;
  children: Array<Folder | File>;
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
  preview?: (item: T) => { dispose: () => void };
}

export interface Extensions {
  [k: string]: ExtensionData<any, any>;
}
