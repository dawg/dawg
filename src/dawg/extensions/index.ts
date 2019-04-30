import * as t from 'io-ts';

export interface ExtensionData {
  [key: string]: string | number | boolean;
}

export interface IExtensionState<T extends ExtensionData> {
  get<K extends keyof T & string>(key: K): T[K] | undefined;
  get<K extends keyof T & string>(key: K, defaultValue: T[K]): T[K];
  set<K extends keyof T & string>(key: K, value: T[K]): Promise<void>;
}

export interface ISettingsState<S extends ExtensionData> extends IExtensionState<S> {
  onDidChangeSettings(cb: <K extends keyof S>(key: K, value: S[K]) => void): { dispose: () => void };
}

export interface IExtensionContext<
  W extends ExtensionData = {},
  G extends ExtensionData = {},
  S extends ExtensionData = {},
> {
  subscriptions: Subscription[];
  workspace: IExtensionState<W>;
  global: IExtensionState<G>;
  settings: ISettingsState<S>;
}

interface Subscription {
  dispose: () => void;
}

class State<T extends ExtensionData> implements IExtensionState<T> {
  private config: ExtensionData = {};

  public get<K extends keyof T & string>(key: K, defaultValue?: T[K]) {
    if (defaultValue === undefined) {
      return this.config[key];
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
}

class Settings<T extends ExtensionData> extends State<T> implements ISettingsState<T> {
  public onDidChangeSettings<K extends keyof T>(cb: (key: K, value: T[K]) => void) {
    return {
      dispose() {
        // TODO
      },
    };
  }
}

export class ExtensionContext<
  W extends ExtensionData = {},
  G extends ExtensionData = {},
  S extends ExtensionData = {},
> implements IExtensionContext<W, G, S> {
  public subscriptions: Subscription[] = [];
  public workspace = new State<W>();
  public global = new State<G>();
  public settings = new Settings<S>();
}



export interface Extension<
  W extends ExtensionData = {},
  G extends ExtensionData = {},
  P extends t.Props = {},
  V = void
> {
  id: string;
  defineSettings?: () => P;
  activate(context: IExtensionContext<W, G, t.TypeOf<t.TypeC<P>>>): V;
  // TODO ACTUALLY DEACTIVATE
  deactivate?(context: IExtensionContext<W, G>): void;
}
