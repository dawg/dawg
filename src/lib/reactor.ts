import { Disposer, peek } from '@/lib/std';
import { emitter } from '@/lib/events';

type Effect = () => void;

interface GetSet<T> {
  get(): T;
  set(x: T): void;
}

const proxy = <T, V>(
  target: V, { get, set }: GetSet<T>,
): V & { value: T } => {
  Object.defineProperty(target, 'value', {
    enumerable: true,
    configurable: true,
    get,
    set,
  });
  return target as V & { value: T };
};

interface Observable {
  [k: string]: any;
}

type DepsMap = Map<string, Set<Effect>>;


// const depsMap = new WeakMap();
// targetMap stores the effects that each object should re-run when it's updated
const targetMap = new WeakMap<Observable, DepsMap>();
const track = (target: Observable, key: string) => {
  if (activeEffects.length === 0) {
    return;
  }

  let depsMap = targetMap.get(target); // Get the current depsMap for this target
  if (!depsMap) {
    // There is no map.
    targetMap.set(target, (depsMap = new Map())); // Create one
  }

  // Get the current dependencies (effects) that need to be run when this is set
  let dep = depsMap.get(key);
  if (!dep) {
    // There is no dependencies (effects)
    depsMap.set(key, (dep = new Set()));
  }

  const top = peek(activeEffects);
  if (!top) {
    return;
  }

  dep.add(top); // Add effect to dependency map
};

const trigger = (target: Observable, key: string) => {
  // Does this object have any properties that have dependencies (effects)
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }

  // If there are dependencies (effects) associated with this
  const dep = depsMap.get(key);
  if (dep) {
    dep.forEach((effect) => {
      // run them all
      effect();
    });
  }
};

function reactive<T extends Observable>(o: T) {
  return new Proxy(o, {
    get(target, key: string, receiver) {
      const result = Reflect.get(target, key, receiver);
      track(target, key); // If this reactive property (target) is GET inside then track the effect to rerun on SET
      return result;
    },
    set(target, key: string, newValue, receiver) {
      const oldValue = target[key];
      const result = Reflect.set(target, key, newValue, receiver);
      if (oldValue !== newValue) {
        trigger(target, key); // If this reactive property (target) has effects to rerun on SET, trigger them.
      }
      return result;
    },
  });
}

export interface ElementChangeContext<T> {
  newValue: T;
  oldValue: T;
}

export type ChangeCallback<T> = (value: ElementChangeContext<T>) => void;

export interface Prim<T> {
  value: T;
  onDidChange(cb: ChangeCallback<T>): Disposer;
}

const helper = <T>(o: { value: T }) => {
  const events = emitter<{ change: [ElementChangeContext<T>] }>();

  return proxy({
    onDidChange: (cb: ChangeCallback<T>) => {
      return events.addListener('change', cb);
    },
  }, {
    get: () => {
      return o.value;
    },
    set: (newValue) => {
      const oldValue = o.value;
      o.value = newValue;

      if (oldValue !== newValue) {
        events.emit('change', { newValue, oldValue });
      }
    },
  });
};

const activeEffects: Array<() => any> = [];

export const prim = <T>(value: T): Prim<T> => {
  const o = reactive({ value });
  return helper(o);
};

export interface Derived<T> {
  readonly value: T;
  onDidChange(cb: ChangeCallback<T>): Disposer;
}

export const derived = <T>(f: () => T): Derived<T> => {
  activeEffects.push(() => {
    o.value = f();
  });

  const value = f();
  const o = reactive({ value });

  activeEffects.pop();

  return helper(o);
};

export type Getter<T> = Readonly<{
  value: T;
}>;

export const getter = <T>(f: () => T): Getter<T> => {
  return Object.defineProperty({}, 'value', {
    get: f,
  });
};

// tslint:disable-next-line:interface-over-type-literal
export type Setter<T> = {
  value: T;
};

export const setter = <T>(g: () => T, s: (value: T) => void): Setter<T> => {
  return Object.defineProperty({}, 'value', {
    get: g,
    set: s,
  });
};
