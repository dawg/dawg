import { Bus } from '../update';

export interface FileTree {
  [fullPath: string]: FileTree | string;
}

type Extension = 'wav' | 'midi' | 'mid';

export type Extensions = {
  [k in Extension]?: string
};

export type EventBus = Bus<{ up: [KeyboardEvent], down: [KeyboardEvent], dblclick: [MouseEvent] }>;
