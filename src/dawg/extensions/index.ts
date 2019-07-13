import * as t from 'io-ts';
import { Wrapper } from 'vue-function-api';

export type ReactiveDefinition<P extends ExtensionProps> = { [K in keyof P]: Wrapper<t.TypeOf<P[K]>> };

export interface IExtensionContext<
  W extends ExtensionProps = ExtensionProps,
  G extends ExtensionProps = ExtensionProps,
> {
  subscriptions: Subscription[];
  workspace: ReactiveDefinition<W>;
  global: ReactiveDefinition<G>;
}

export interface Subscription {
  dispose: () => void;
}

export class ExtensionContext<
  W extends ExtensionProps = {},
  G extends ExtensionProps = {},
> implements IExtensionContext<W, G> {
  public subscriptions: Subscription[] = [];
  public workspace: ReactiveDefinition<W>;
  public global: ReactiveDefinition<G>;

  constructor(workspace: ReactiveDefinition<W>, global: ReactiveDefinition<G>) {
    this.workspace = workspace;
    this.global = global;
  }
}

export type Primitive = t.BooleanC | t.StringC | t.NumberC;
export type ArrayPrimitive = t.ArrayC<t.BooleanC> | t.ArrayC<t.StringC> | t.ArrayC<t.NumberC>;
export type StateType = Primitive | ArrayPrimitive;

export interface ExtensionProps {
  [key: string]: StateType;
}

type TypeOf<P extends ExtensionProps> = t.TypeOf<t.TypeC<P>>;

type T = TypeOf<{ tt: t.BooleanC }>;

export interface Extension<
  W extends ExtensionProps = ExtensionProps,
  G extends ExtensionProps = ExtensionProps,
  V = void,
> {
  id: string;
  workspace?: W;
  global?: G;
  activate(context: IExtensionContext<W, G>): V;
  // TODO ACTUALLY DEACTIVATE
  deactivate?(context: IExtensionContext<W, G>): void;
}

export const createExtension = <
  W extends ExtensionProps,
  G extends ExtensionProps,
  V
>(extension: Extension<W, G, V>) => {
  return extension;
};
