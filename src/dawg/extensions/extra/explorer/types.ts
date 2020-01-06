import { Ref } from '@vue/composition-api';

export interface File {
  type: 'file';
  parent: Folder | null;
  path: string;
  isExpanded: Ref<boolean>;
  isSelected: Ref<boolean>;
  value: string;
}

export interface Folder {
  type: 'folder';
  parent: Folder | null;
  path: string;
  isExpanded: Ref<boolean>;
  isSelected: Ref<boolean>;
  children: {
    [fullPath: string]: Folder | File,
  };
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
