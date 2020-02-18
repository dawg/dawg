import { SchedulableTemp } from '@/models/schedulable';
import { Transport } from '@/lib/audio/transport';
import { StrictEventEmitter } from '@/lib/events';
import * as history from '@/core/project/history';


const watchElement = <T extends SchedulableTemp<any, any>>(elements: T[], element: T, onRemove: (event: T) => void) => {
  const disposer = element.onDidRemove(() => {
    const i = elements.indexOf(element);
    if (i >= 0) {
      onRemove(element);
      elements.splice(i, 1);
    }
    disposer.dispose();
  });
};

export class Sequence<T extends SchedulableTemp<any, any>> extends StrictEventEmitter<{ added: [T], removed: [T] }> {
  public map = this.elements.map.bind(this.elements);
  public filter = this.elements.filter.bind(this.elements);
  public forEach = this.elements.forEach.bind(this.elements);
  public some = this.elements.some.bind(this.elements);
  public every = this.elements.every.bind(this.elements);

  constructor(public elements: T[]) {
    super();
    elements.forEach((e) => watchElement(elements, e, this.onRemove.bind(this)));
  }

  public add(...elements: T[]) {
    history.execute({
      execute: () => {
        elements.forEach((e) => {
          this.elements.push(e);
          watchElement(this.elements, e, this.onRemove.bind(this));
          this.emit('added', e);
        });
      },
      undo: () => {
        elements.forEach((element) => element.removeNoHistory());
      },
    });
  }

  public slice() {
    return this.elements.slice();
  }

  public [Symbol.iterator]() {
    return this.elements[Symbol.iterator];
  }

  private onRemove(element: T) {
    this.emit('removed', element);
  }
}
