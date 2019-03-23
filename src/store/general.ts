import { Module, getModule, Mutation, Action } from 'vuex-module-decorators';
import SideBar from '@/components/SideBar.vue';
import fs from 'mz/fs';
import BaseTabs from '@/components/BaseTabs.vue';
import store from '@/store/store';
import { VuexModule } from '@/store/utils';
import backend, { ProjectInfo } from '@/backend';
import { User } from 'firebase';
import { Project } from './project';
import { remote } from 'electron';
import cache from './cache';

export interface InitializationError {
  type: 'error';
  message: string;
  project: Project;
}

export interface InitializationSuccess {
  type: 'success';
  project: Project;
}

/**
 * This module is used to move data throughout the sections. It is not serialized in any way.
 */
@Module({ dynamic: true, store, name: 'general' })
export class General extends VuexModule {
  public project = Project.newProject();
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
  public async loadProject(): Promise<InitializationError | InitializationSuccess> {
    for (const path of [cache.backupTempPath, cache.openedFile]) {
      if (!path) {
        continue;
      }

      if (cache.backupTempPath === path) {
        // Always reset to null
        fs.unlink(path);
        cache.setBackupTempPath(null);
      } else {
        // This means that we are opening the cache file
        this.setOpenedFile(path);
      }

      const result = await Project.fromFile(path);
      if (result.type === 'error') {
        return {
          type: 'error',
          message: result.message,
          project: await Project.newProject(),
        };
      }

      return {
        type: 'success',
        project: result.project,
      };
    }

    if (cache.openedFile) {
      fs.exists(cache.openedFile, (_, exists) => {
        if (!exists) {
          cache.setOpenedFile(null);
        }
      });
    }

    return {
      type: 'success',
      project: await Project.newProject(),
    };
  }

  @Action
  public async saveProject(opts: { backup: boolean, user: User | null, forceDialog?: boolean }) {
    let openedFile = this.openedFile;
    if (!openedFile || opts.forceDialog) {
      openedFile = remote.dialog.showSaveDialog(remote.getCurrentWindow(), {}) || null;

      // If the user cancels the dialog
      if (!openedFile) {
        return;
      }

      cache.setOpenedFile(openedFile);

      // This should never be true but we need to check
      if (!cache.openedFile) {
        return;
      }

      if (!cache.openedFile.endsWith('.dg')) {
        cache.setOpenedFile(cache.openedFile + '.dg');
      }
    }

    const encoded = this.project.serialize();

    await fs.writeFile(openedFile, JSON.stringify(encoded, null, 4));

    // I don't think this is the best place to put this.
    if (opts.backup && opts.user && encoded.name) {
      return await backend.updateProject(opts.user, this.project.id, encoded as any);
    }
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
  public setProject(project: Project) {
    this.project = project;
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
