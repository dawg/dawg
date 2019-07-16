import { Bus } from '@/modules/update';
import { ClickCommand } from '@/dawg/base/ui';

export interface ContextPayload {
  event: MouseEvent | Position;
  items: Array<ClickCommand | null>;
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
