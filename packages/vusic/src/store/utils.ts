import { VuexModule as VM, Mutation } from 'vuex-module-decorators';

export class VuexModule extends VM {
  @Mutation
  public set<T extends keyof this & string, V extends this[T]>(options: { key: T, value: V }) {
    this[options.key] = options.value;
  }
}
