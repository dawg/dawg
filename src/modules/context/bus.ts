import { Key } from '@/modules/palette';
import { Bus } from '@/modules/update';

export interface Item {
  text: string;
  shortcut?: Key[];
  callback: (e: MouseEvent) => void;
}

export interface ContextPayload {
  event: MouseEvent | Position;
  items: Array<Item | null>;
  left?: boolean;
}

export interface Position {
  left: number;
  bottom: number;
}

export const isMouseEvent = (e: object): e is MouseEvent => {
  return e instanceof Event;
};

export default new Bus<{ show: [ContextPayload] }>();
