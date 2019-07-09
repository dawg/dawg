import { Module as Mod } from 'vuex';
import { Module, getModule, Mutation } from 'vuex-module-decorators';
import { VuexModule } from '@/store/utils';
import * as io from '@/modules/cerialize';
import store from '@/store/store';

@Module({ dynamic: true, store, name: 'workspace' })
export class Specific extends VuexModule {
  @io.auto({ nullable: true }) public pythonPath: string | null = null;
  @io.auto({ nullable: true }) public modelsPath: string | null = null;

  constructor(module?: Mod<any, any>) {
    super(module || {});
  }

  @Mutation
  public setPythonPath(pythonPath: string) {
    this.pythonPath = pythonPath;
  }

  @Mutation
  public setModelsPath(modelsPath: string) {
    this.modelsPath = modelsPath;
  }
}

export default getModule(Specific);
