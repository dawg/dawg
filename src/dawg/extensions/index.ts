import * as t from '@/modules/io';
import { Ref } from '@vue/composition-api';

export type Primitive = t.BooleanC | t.StringC | t.NumberC;
export type ArrayPrimitive = t.ArrayC<t.BooleanC> | t.ArrayC<t.StringC> | t.ArrayC<t.NumberC>;
export type StateType = Primitive | ArrayPrimitive;

export interface ExtensionProps {
  [key: string]: StateType | FieldOptions<StateType>;
}

type Prop<T extends StateType> = FieldOptions<T> | t.TypeOf<T>;
export type FieldOptions<T extends StateType> = {
  type: T;
  expose: false;
  default?: t.TypeOf<T>;
} | {
  type: T;
  expose: true;
  definition: string;
  label: string;
  default?: t.TypeOf<T>;
};

type InferPropType<T> =
  T extends StateType ?
  t.TypeOf<T> : T extends Prop<infer V> ?
  t.TypeOf<V> : unknown;

declare type RequiredKeys<T> = {
  [K in keyof T]: T[K] extends { default: any; } ? K : never;
}[keyof T];
declare type OptionalKeys<T> = Exclude<keyof T, RequiredKeys<T>>;

export type ExtensionData<
  P extends ExtensionProps,
> =
  { [K in RequiredKeys<P>]: InferPropType<P[K]> } &
  { [K in OptionalKeys<P>]: InferPropType<P[K]> | undefined };

export type ReactiveDefinition<
  P extends ExtensionProps,
> =
  { [K in RequiredKeys<P>]: Ref<InferPropType<P[K]>> } &
  { [K in OptionalKeys<P>]: Ref<InferPropType<P[K]> | undefined> };

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
  W extends ExtensionProps,
  G extends ExtensionProps,
> implements IExtensionContext<W, G> {
  public subscriptions: Subscription[] = [];
  public workspace: ReactiveDefinition<W>;
  public global: ReactiveDefinition<G>;

  constructor(workspace: ReactiveDefinition<W>, global: ReactiveDefinition<G>) {
    this.workspace = workspace;
    this.global = global;
  }
}

export interface Extension<
  W extends ExtensionProps = ExtensionProps,
  G extends ExtensionProps = ExtensionProps,
  V = void,
> {
  id: string;
  workspace?: W;
  global?: G;
  activate(context: IExtensionContext<W, G>): V;
  deactivate?(context: IExtensionContext<W, G>): void;
}

export const createExtension = <
  W extends ExtensionProps,
  G extends ExtensionProps,
  V
>(extension: Extension<W, G, V>) => {
  return extension;
};
