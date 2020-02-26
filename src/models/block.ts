import { emitter } from '@/lib/events';

export abstract class BuildingBlock {
  public abstract id: string;
  public abstract readonly name: string;
  private events = emitter<{ delete: [], undoDelete: [] }>();

  public notifyOfDeletion() {
    this.events.emit('delete');
    return {
      undo: () => {
        this.events.emit('delete');
      },
    };
  }

  public onDidDelete(cb: () => void) {
    return this.events.addListener('delete', cb);
  }

  public onUndidDelete(cb: () => void) {
    return this.events.addListener('undoDelete', cb);
  }
}
