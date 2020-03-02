import { ScheduledElement } from '@/models/schedulable';
import { emitter } from '@/lib/events';
import * as oly from '@/olyger';

// TODO move
export const watchOlyArray = <T extends ScheduledElement<any, any, any>>(arr: oly.OlyArr<T>) => {
  arr.onDidRemove(({ items, subscriptions }) => {
    subscriptions.push(...items.map((item) => item.remove()));
  });

  return arr;
};
