import { peek, Disposer, reverse } from '@/lib/std';
import Vue from 'vue';
import { computed, reactive } from '@vue/composition-api';
import { emitter } from '@/lib/events';
import { getLogger } from '@/lib/log';

const logger = getLogger('olyger', { level: 'debug' });

const RefKey = 'vfa.key.refKey';

interface Command<T> {
  name: string;
  execute: () => T;
  undo: () => void;
  subscriptions: Subscription[];
}

interface ExecutedCommand<T> extends Command<T> {
  undoers: Array<ReturnType<Subscription['execute']>>;
}

interface ExecutedAction<T> {
  commands: Array<ExecutedCommand<T>>;
}

interface Action<T> {
  commands: Array<Command<T>>;
}

const undoHistory: Array<ExecutedAction<any>> = [];
let redoHistory: Array<Action<any>> = [];

const context: { reference?: Action<any>, top?: Action<any> } = reactive({
  reference: undefined,
  top: undefined,
});

export const hasUnsavedChanged = computed(() => {
  return context.top !== context.reference;
});


let action: ExecutedAction<any> | undefined;
const getOrCreateExecutionContext = () => {
  const startOfExecution = action === undefined;
  if (!action) {
    action = { commands: [] };
  }

  // create a local copy which is not undefined
  const local = action;

  const execute = <T>(command: Command<T>) => {
    const result = command.execute();
    local.commands.push({
      ...command,
      undoers: command.subscriptions.map((subscription) => subscription.execute()),
    });

    return result;
  };

  if (!startOfExecution) {
    return {
      execute,
      finish: () => {
        // do nothing
      },
    };
  }

  if (action) {
    action = action;
  }



  return {
    execute,
    finish: () => {
      undoHistory.push(local);
      context.top = local;
      redoHistory = [];
      action = undefined;

      logger.debug(
        `Finished executing -> ${local.commands.map((c) => c.name).join(', ')} [${undoHistory.length}, ${redoHistory.length}]`,
      );
    },
  };
};



export const undo = (): 'empty' | 'performed' => {
  const undoTop = undoHistory.pop();
  if (!undoTop) {
    return 'empty';
  }

  for (const command of reverse(undoTop.commands)) {
    command.undo();
    command.undoers.forEach((undoer) => undoer.undo());
  }

  redoHistory.push(undoTop);
  context.top = peek(undoHistory);

  logger.debug(
    `Finished undoing -> ${undoTop.commands.map((c) => c.name).join(', ')} [${undoHistory.length}, ${redoHistory.length}]`,
  );

  return 'performed';
};

export const redo = (): 'empty' | 'performed' => {
  const redoTop = redoHistory.pop();
  if (!redoTop) {
    return 'empty';
  }

  for (const command of redoTop.commands) {
    command.execute();
  }

  undoHistory.push({
    commands: redoTop.commands.map((command) => {
      return {
        ...command,
        undoers: command.subscriptions.map((subscription) => subscription.execute()),
      };
    }),
  });

  context.top = redoTop;

  logger.debug(
    `Finished redoing -> ${redoTop.commands.map((c) => c.name).join(', ')} [${undoHistory.length}, ${redoHistory.length}]`,
  );

  return 'performed';
};

export const freezeReference = () => {
  context.reference = peek(undoHistory);
};

function proxy<T, V>(
  target: V, { get, set }: GetSet<T>,
): V & { value: T } {
  Object.defineProperty(target, 'value', {
    enumerable: true,
    configurable: true,
    get,
    set,
  });
  return target as V & { value: T };
}

interface GetSet<T> {
  get(): T;
  set(x: T): void;
}

interface Ref<T> {
  value: T;
}

interface Subscription {
  execute: () => { undo: () => void };
}

interface ElementChangeContext<T> {
  newValue: T;
  oldValue: T;
  subscriptions: Subscription[];
}

interface ElementChaining<T> {
  onDidChange: (cb: (o: ElementChangeContext<T>) => void) => Disposer;
}

export type OlyRef<T> = Ref<T> & ElementChaining<T>;

export function olyRef<T>(raw: T): Ref<T> & ElementChaining<T> {
  const o = reactive({ [RefKey]: raw }) as { [RefKey]: T };

  const events = emitter<{ change: [ElementChangeContext<T>] }>();

  const ref = proxy({}, {
    get: () => o[RefKey],
    set: (v) => {
      const oldValue = o[RefKey];

      const subscriptions: Subscription[] = [];

      // This is important as it prevents a command being placed on the stack
      if (oldValue === v) {
        return;
      }

      const env = getOrCreateExecutionContext();
      env.execute({
        name: 'set',
        subscriptions,
        execute: () => {
          o[RefKey] = v;
        },
        undo: () => {
          o[RefKey] = oldValue;
        },
      });

      events.emit('change', { newValue: v, oldValue, subscriptions });

      env.finish();
    },
  });

  const chaining: ElementChaining<T> = {
    onDidChange: (cb) => events.on('change', cb),
  };

  return Object.assign(ref, chaining);
}

interface Items<T> {
  items: T[];
  startingIndex: number;
  subscriptions: Subscription[];
}

interface ArrayChaining<T> {
  onDidAdd: (cb: (o: Items<T>) => void) => Disposer;
  onDidRemove: (cb: (o: Items<T>) => void) => Disposer;
}

export type OlyArr<T> = T[] & ArrayChaining<T>;

const olyArrImpl = <T>(raw: T[]): OlyArr<T> => {
  // Explicitly make the array observable because we replace some of the methods
  // We store local variables in this closure and these NEED to be the vue ones for reactivity
  // Therefore, we make the following call
  raw = Vue.observable(raw);

  const events = emitter<{ add: [Items<T>], remove: [Items<T>] }>();

  const push = raw.push.bind(raw);
  const splice = raw.splice.bind(raw);

  // const pop = raw.pop;
  // const shift = raw.shift;
  // const unshift = raw.unshift;

  raw.push = (...items) => {
    const length = raw.length;
    const subscriptions: Subscription[] = [];
    const env = getOrCreateExecutionContext();

    const addedLength = env.execute({
      name: 'push',
      subscriptions,
      execute: () => {
        const result = push(...items);
        events.emit('add', { items, startingIndex: length, subscriptions });
        return result;
      },
      undo: () => {
        splice(length, items.length);
      },
    });

    env.finish();

    return addedLength;
  };

  raw.splice = (start: number, deleteCount: number, ...items: T[]) => {
    const subscriptions: Subscription[] = [];
    const env = getOrCreateExecutionContext();

    const deleted: T[] = env.execute({
      name: 'splice',
      subscriptions,
      execute: () => {
        const result = splice(start, deleteCount, ...items);
        events.emit('remove', { items: result, startingIndex: start, subscriptions });
        events.emit('add', { items, startingIndex: start, subscriptions });
        return result;
      },
      undo: () => {
        splice(start, items.length, ...deleted);
      },
    });

    env.finish();

    return deleted;
  };

  const chaining: ArrayChaining<T> = {
    onDidAdd: (f) => events.on('add', f),
    onDidRemove: (f) => events.on('remove', f),
  };

  return Object.assign(
    raw,
    chaining,
  );
};

export function olyArr<T>(raw: T[]): OlyArr<T> {
  return olyArrImpl(raw);
}
