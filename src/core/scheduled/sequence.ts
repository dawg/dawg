import { Schedulable } from '@/core/scheduled/schedulable';
import { Transport } from '@/modules/audio/transport';
import { StrictEventEmitter } from '@/modules/audio/events';


const watchElement = <T extends Schedulable>(elements: T[], element: T) => {
  const disposer = element.on('remove', () => {
    const i = elements.indexOf(element);
    if (i >= 0) {
      elements.splice(i, 1);
    }
    disposer.dispose();
  });
};

export class Sequence<T extends Schedulable> extends StrictEventEmitter<{ added: [T] }> {
  constructor(private transport: Transport, public elements: T[]) {
    super();
    elements.forEach((e) => watchElement(elements, e));
  }

  public push(element: T) {
    this.elements.push(element);
    element.schedule(this.transport);
    watchElement(this.elements, element);
    this.emit('added', element);
  }
}
