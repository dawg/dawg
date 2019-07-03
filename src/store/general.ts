import { Module, getModule, Mutation, Action } from 'vuex-module-decorators';
import SideBar from '@/components/SideBar.vue';
import fs from '@/wrappers/fs';
import BaseTabs from '@/components/BaseTabs.vue';
import store from '@/store/store';
import { VuexModule } from '@/store/utils';
import { Project } from './project';
import { remote } from 'electron';
import cache from './cache';
import { Sample } from '@/core';
import { DG_EXTENSION } from '@/constants';

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

  // TODO(jacob)
  public isRecordingMicrophone = false;
  public isRecording: boolean = false;

  /**
   * The sample that is currently opened in the sample panel.
   */
  public openedSample: Sample | null = null;

  /**
   * The actual file that is currently opened. This is not the same as the opened file in the cache.
   */
  public projectPath: string | null = null;

  @Action
  public async loadProject(): Promise<InitializationError | InitializationSuccess> {
    for (const path of [cache.backupTempPath, cache.openedFile]) {
      if (!path) {
        continue;
      }

      const result = await Project.fromFile(path);

      // We always complete the following action, even if there is an error
      if (cache.backupTempPath === path) {
        // Always reset to null
        fs.unlink(path);
        cache.setBackupTempPath(null);
      }

      if (result.type === 'error') {
        return {
          type: 'error',
          message: result.message,
          project: await Project.newProject(),
        };
      }

      // Only set this if we've actually opened a project successfully
      if (cache.openedFile === path) {
        // This means that we are opening the file path in the cache
        this.setOpenedFile(path);
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
  public async saveProject(opts: { forceDialog?: boolean }) {
    let projectPath = this.projectPath;
    if (!projectPath || opts.forceDialog) {
      projectPath = remote.dialog.showSaveDialog(remote.getCurrentWindow(), {}) || null;

      // If the user cancels the dialog
      if (!projectPath) {
        return;
      }

      if (!projectPath.endsWith(DG_EXTENSION)) {
        projectPath = projectPath + DG_EXTENSION;
      }

      // Make sure we set the cache and the general
      // The cache is what is written to the filesystem
      // and the general is the file that is currently opened
      cache.setOpenedFile(projectPath);
      this.setOpenedFile(projectPath);

      // This should never be true but we need to check
      if (!cache.openedFile) {
        return;
      }
    }

    const encoded = this.project.serialize();

    await fs.writeFile(projectPath, JSON.stringify(encoded, null, 4));
  }

  @Mutation
  public setProject(project: Project) {
    this.project = project;
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
  public setRecordingMicrophone(recording: boolean) {
    this.isRecordingMicrophone = recording;
  }

  @Mutation
  public toggleRecording() {
    this.isRecording = !this.isRecording;
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
    this.projectPath = file;
  }

  @Mutation
  public setSample(sample: Sample) {
    this.openedSample = sample;
  }
}

export default getModule(General);
