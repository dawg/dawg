import { Module, getModule, Mutation, Action } from 'vuex-module-decorators';

import SideBar from '@/components/SideBar.vue';
import BaseTabs from '@/components/BaseTabs.vue';
import store from '@/store/store';
import { VuexModule } from '@/store/utils';
import backend, { ProjectInfo } from '@/backend';

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

  @Action
  public async loadProjects() {
    const res =  await backend.getProjects();

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
}

export default getModule(General);
