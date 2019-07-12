import * as t from 'io-ts';

type BasicType = string | number | boolean;

export interface ExtensionData {
  [key: string]: BasicType | BasicType[];
}

export interface IExtensionState<T extends ExtensionData> {
  get<K extends keyof T & string>(key: K): T[K] | undefined;
  get<K extends keyof T & string>(key: K, defaultValue: T[K]): T[K];
  set<K extends keyof T & string>(key: K, value: T[K]): Promise<void>;
  remove<K extends keyof T & string>(key: K): void;
  getData(): ExtensionData;
}

export interface IExtensionContext<
  W extends ExtensionData = {},
  G extends ExtensionData = {},
> {
  subscriptions: Subscription[];
  workspace: IExtensionState<W>;
  global: IExtensionState<G>;
}

interface Subscription {
  dispose: () => void;
}

class State<T extends ExtensionData> implements IExtensionState<T> {
  constructor(private config: ExtensionData) {}

  public get<K extends keyof T & string>(key: K, defaultValue?: T[K]) {
    if (defaultValue === undefined) {
      // FIXME Remove this any. We shouldn't need it but for some reason we do.
      return this.config[key] as any;
    } else {
      return this.config[key] === undefined ? defaultValue : this.config[key];
    }
  }

  public set<K extends keyof T & string>(key: K, value: T[K]): Promise<void> {
    return new Promise((resolve) => {
      this.config[key] = value;
      resolve();
    });
  }

  public remove<K extends keyof T & string>(key: K) {
    delete this.config[key];
  }

  public getData() {
    return this.config;
  }
}

export class ExtensionContext<
  W extends ExtensionData = {},
  G extends ExtensionData = {},
> implements IExtensionContext<W, G> {
  public subscriptions: Subscription[] = [];
  public workspace: State<W>;
  public global: State<G>;

  constructor(workspace: ExtensionData, global: ExtensionData) {
    this.workspace = new State<W>(workspace);
    this.global = new State<G>(global);
  }
}



export interface Extension<
  WorkspaceType extends ExtensionData = {},
  GlobalType extends ExtensionData = {},
  V = void
> {
  id: string;
  activate(context: IExtensionContext<WorkspaceType, GlobalType>): V;
  // TODO ACTUALLY DEACTIVATE
  deactivate?(context: IExtensionContext<WorkspaceType, GlobalType>): void;
}

export const createExtension = <
  W extends ExtensionData = {},
  G extends ExtensionData = {},
  V = void
>(extension: Extension<W, G, V>) => {
  return extension;
};
