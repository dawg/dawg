import { ScheduledElement } from '@/models/schedulable';
import { emitter } from '@/lib/events';
import * as history from '@/core/project/history';
import { Disposer } from '@/lib/std';
import { getLogger } from '@/lib/log';

const logger = getLogger('sequence', { level: 'debug' });

const watchElement = <T extends ScheduledElement<any, any, any>>(
  l: T[], el: T, onRemove: (event: T) => void, onAdd: (event: T) => void,
) => {
  let i: number | undefined;
  const d1 = el.onDidRemove(() => {
    i = l.indexOf(el);
    if (i >= 0) {
      onRemove(el);
      l.splice(i, 1);
    }
    d1.dispose();
  });

  const d2 = el.onUndidRemove(() => {
    if (i === undefined) {
      return;
    }

    if (i >= 0) {
      onAdd(el);
      l.splice(i, 0, el);
    }

    d2.dispose();
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
    watchElement(l, e, onRemove, onAdd);
  });

  function add(...newL: T[]) {
    history.execute({
      execute: () => {
        logger.debug(`Adding ${newL.length} elements!`);
        newL.forEach((el) => {
          l.push(el);
          watchElement(l, el, onRemove, onAdd);
          onAdd(el);
        });
      },
      undo: () => {
        logger.debug(`Removing ${newL.length} elements!`);
        newL.forEach((el) => {
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

  function onAdd(el: T) {
    events.emit('added', el);
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
