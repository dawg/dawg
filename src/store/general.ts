import { Module, getModule, Mutation, Action } from 'vuex-module-decorators';

import SideBar from '@/components/SideBar.vue';
import BaseTabs from '@/components/BaseTabs.vue';
import store from '@/store/store';
import { VuexModule } from '@/store/utils';
import backend, { ProjectInfo } from '@/backend';
import { User } from 'firebase';

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
  public projects: ProjectInfo[] = [];
  public getProjectsErrorMessage: string | null = null;
  public user: User | null = null;

  /**
   * The actual file that is currently opened. This is not the same as the opened file in the cache.
   */
  public openedFile: string | null = null;

  get authenticated() {
    return !!this.user;
  }

  @Action
  public setUser(user: User | null) {
    this.set({ key: 'user', value: user });
  }

  @Action
  public async loadProjects(user: User) {
    const res =  await backend.getProjects(user);

    if (res.type === 'success') {
      this.setProjects(res.projects);
    }

    if (res.type === 'error') {
      this.setErrorMessage(res.message);
    }
  }

  @Mutation
  public setProjects(projects: ProjectInfo[]) {
    this.projects = projects;
  }

  @Mutation
  public setErrorMessage(message: string) {
    this.getProjectsErrorMessage = message;
  }

  @Mutation
  public setSideBarTabs(sideBarTabs: SideBar[]) {
    this.sideBarTabs = sideBarTabs;
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

  @Mutation
  public setOpenedFile(file: string) {
    this.openedFile = file;
  }
}

export default getModule(General);
