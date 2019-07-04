import * as t from 'io-ts';

type BasicType = string | number | boolean;

export interface ExtensionData {
  [key: string]: BasicType | BasicType[];
}

export interface IExtensionState<T extends ExtensionData> {
  get<K extends keyof T & string>(key: K): T[K] | undefined;
  get<K extends keyof T & string>(key: K, defaultValue: T[K]): T[K];
  set<K extends keyof T & string>(key: K, value: T[K]): Promise<void>;
  getData(): ExtensionData;
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

  public getData() {
    return this.config;
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
  public workspace: State<W>;
  public global: State<G>;
  public settings: Settings<S>;

  constructor(workspace: ExtensionData, global: ExtensionData, settings: ExtensionData) {
    this.workspace = new State<W>(workspace);
    this.global = new State<G>(global);
    this.settings = new Settings<S>(settings);
  }
}



export interface Extension<
  WorkspaceType extends ExtensionData = {},
  GlobalType extends ExtensionData = {},
  SettingType extends t.Props = {},
  V = void
> {
  id: string;
  defineSettings?: () => SettingType;
  activate(context: IExtensionContext<WorkspaceType, GlobalType, t.TypeOf<t.TypeC<SettingType>>>): V;
  // TODO ACTUALLY DEACTIVATE
  deactivate?(context: IExtensionContext<WorkspaceType, GlobalType>): void;
}
