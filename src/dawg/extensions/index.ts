import * as t from '@/modules/io';
import { Ref } from '@vue/composition-api';
import { VueConstructor } from 'vue';

export type StateType = t.Mixed;

export interface ExtensionProps {
  [key: string]: StateType | FieldOptions<any>;
}

export interface FieldOptions<T extends StateType> {
  type: T;
  default?: t.TypeOf<T>;
}

type InferPropType<T> =
  T extends StateType ?
  t.TypeOf<T> : T extends FieldOptions<infer V> ?
  t.TypeOf<V> : unknown;

const ttt = {
  type: t.array(t.string),
  default: [],
};

type TT = InferPropType<typeof ttt>;

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

export interface StringInput {
  label: string | Ref<string>;
  description: string | Ref<string>;
  disabled?: boolean | Ref<boolean>;
  type: 'string';
  value: Ref<string | undefined>;
}

export interface SelectInput<T extends string> {
  label: string | Ref<string>;
  description: string | Ref<string>;
  disabled?: boolean | Ref<boolean>;
  type: 'select';
  value: Ref<T | undefined>;
  options: T[];
}

export interface BooleanInput {
  label: string | Ref<string>;
  description: string | Ref<string>;
  disabled?: boolean | Ref<boolean>;
  type: 'boolean';
  value: Ref<boolean>;
  checkedValue: string;
  uncheckedValue: string;
}

export interface VueInput {
  label: string | Ref<string>;
  description: string | Ref<string>;
  type: 'component';
  component: VueConstructor;
}

export type Setting = StringInput | SelectInput<string> | BooleanInput | VueInput;

export interface IExtensionContext<
  W extends ExtensionProps = ExtensionProps,
  G extends ExtensionProps = ExtensionProps,
> {
  subscriptions: Subscription[];
  workspace: ReactiveDefinition<W>;
  global: ReactiveDefinition<G>;
  settings: Setting[];
}

export interface Subscription {
  dispose: () => void;
}

export const createExtensionContext = <
  W extends ExtensionProps,
  G extends ExtensionProps,
>(workspace: ReactiveDefinition<W>, global: ReactiveDefinition<G>): IExtensionContext<W, G> => {
  return {
    subscriptions: [],
    workspace,
    global,
    settings: [],
  };
};

export interface Extension<
  W extends ExtensionProps = ExtensionProps,
  G extends ExtensionProps = ExtensionProps,
  V = void,
> {
  id: string;
  name?: string;
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
