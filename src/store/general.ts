import { VuexModule, Module, getModule } from 'vuex-module-decorators';

import SideBar from '@/components/SideBar.vue';
import BaseTabs from '@/components/BaseTabs.vue';
import store from '@/store/store';

@Module({ dynamic: true, store, name: 'general' })
export class General extends VuexModule {
  public sideBarTabs: SideBar[] = [];
  public panels: BaseTabs | null = null;
  public toolbarHeight = 64;
  public play = false;
}

export default getModule(General);
