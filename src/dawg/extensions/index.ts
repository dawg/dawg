import * as t from 'io-ts';
import { Wrapper } from 'vue-function-api';

export type Primitive = t.BooleanC | t.StringC | t.NumberC;
export type ArrayPrimitive = t.ArrayC<t.BooleanC> | t.ArrayC<t.StringC> | t.ArrayC<t.NumberC>;
export type StateType = Primitive | ArrayPrimitive;

export interface ExtensionProps {
  [key: string]: StateType;
}

export type ExtensionDefaults<P extends ExtensionProps> = {
  [K in keyof P]: t.TypeOf<P[K]> | undefined;
};

export type ReactiveDefinition<
  P extends ExtensionProps,
  D extends ExtensionDefaults<P>,
> = { [K in keyof P]: Wrapper<t.TypeOf<P[K]> | D[K]> };

export interface IExtensionContext<
  W extends ExtensionProps = ExtensionProps,
  WD extends ExtensionDefaults<W> = ExtensionDefaults<W>,
  G extends ExtensionProps = ExtensionProps,
  GD extends ExtensionDefaults<G> = ExtensionDefaults<G>,
> {
  subscriptions: Subscription[];
  workspace: ReactiveDefinition<W, WD>;
  global: ReactiveDefinition<G, GD>;
}

export interface Subscription {
  dispose: () => void;
}

export class ExtensionContext<
  W extends ExtensionProps,
  WD extends ExtensionDefaults<W>,
  G extends ExtensionProps,
  GD extends ExtensionDefaults<G>,
> implements IExtensionContext<W, WD, G, GD> {
  public subscriptions: Subscription[] = [];
  public workspace: ReactiveDefinition<W, WD>;
  public global: ReactiveDefinition<G, GD>;

  constructor(workspace: ReactiveDefinition<W, WD>, global: ReactiveDefinition<G, GD>) {
    this.workspace = workspace;
    this.global = global;
  }
}

export interface Extension<
  W extends ExtensionProps = ExtensionProps,
  WD extends ExtensionDefaults<W> = ExtensionDefaults<W>,
  G extends ExtensionProps = ExtensionProps,
  GD extends ExtensionDefaults<G> = ExtensionDefaults<G>,
  V = void,
> {
  id: string;
  workspace?: W;
  workspaceDefaults?: WD;
  global?: G;
  globalDefaults?: GD;
  activate(context: IExtensionContext<W, WD, G, GD>): V;
  deactivate?(context: IExtensionContext<W, WD, G, GD>): void;
}

export const createExtension = <
  W extends ExtensionProps,
  WD extends ExtensionDefaults<W>,
  G extends ExtensionProps,
  GD extends ExtensionDefaults<G>,
  V
>(extension: Extension<W, WD, G, GD, V>) => {
  return extension;
};
