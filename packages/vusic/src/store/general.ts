import { Module, getModule, Mutation } from 'vuex-module-decorators';

import SideBar from '@/components/SideBar.vue';
import BaseTabs from '@/components/BaseTabs.vue';
import store from '@/store/store';
import { ApplicationContext } from '@/constants';
import { VuexModule } from '@/store/utils';

/**
 * This module is used to move data throughout the sections. It is not serialized in any way.
 */
@Module({ dynamic: true, store, name: 'general' })
export class General extends VuexModule {
  public sideBarTabs: SideBar[] = [];
  public panels: BaseTabs | null = null;
  public toolbarHeight = 64;
  public play = false;
  public syncing = false;
  public backupError = false;
  public applicationContext: ApplicationContext = 'pianoroll';

  @Mutation
  public setSideBarTabs(sideBarTabs: SideBar[]) {
    this.sideBarTabs = sideBarTabs;
  }

  @Mutation
  public setContext(context: ApplicationContext) {
    this.applicationContext = context;
    this.play = false;
  }

  @Mutation
  public setPanels(panels: BaseTabs) {
    this.panels = panels;
  }

  @Mutation
  public start() {
    this.play = true;
  }

  @Mutation
  public pause() {
    this.play = false;
  }

  get playlistPlay() {
    return this.play && this.applicationContext === 'playlist';
  }

  get pianoRollPlay() {
    return this.play && this.applicationContext === 'pianoroll';
  }
}

export default getModule(General);
