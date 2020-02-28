import { ScheduledElement } from '@/models/schedulable';
import { emitter } from '@/lib/events';
import * as history from '@/core/project/history';
import { Disposer } from '@/lib/std';


const watchElement = <T extends ScheduledElement<any, any, any>>(
  l: T[], el: T, onRemove: (event: T) => void,
) => {
  const disposer = el.onDidRemove(() => {
    const i = l.indexOf(el);
    if (i >= 0) {
      onRemove(el);
      l.splice(i, 1);
    }
    disposer.dispose();
  });
};

export interface Sequence<T extends ScheduledElement<any, any, any>> {
  l: T[];
  add(...newL: T[]): void;
  onDidAddElement(cb: (el: T) => void): Disposer;
  onDidRemoveElement(cb: (el: T) => void): Disposer;
}

export const createSequence = <T extends ScheduledElement<any, any, any>>(l: T[]): Sequence<T> => {
  const events = emitter<{ added: [T], removed: [T] }>();

  l.forEach((e) => {
    watchElement(l, e, onRemove);
    l.push(e);
  });

  function add(...newL: T[]) {
    history.execute({
      execute: () => {
        newL.forEach((el) => {
          l.push(el);
          watchElement(l, el, onRemove);
          events.emit('added', el);
        });
      },
      undo: () => {
        newL.forEach((el) => {
          onRemove(el);
          el.removeNoHistory();
        });
      },
    });
  }

  function onDidAddElement(cb: (el: T) => void) {
    return events.on('added', cb);
  }

  function onDidRemoveElement(cb: (el: T) => void) {
    return events.on('removed', cb);
  }

  function onRemove(el: T) {
    events.emit('removed', el);
  }

  return {
    add,
    onDidAddElement,
    onDidRemoveElement,
    l,
  };
};
