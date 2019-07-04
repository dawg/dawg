import { Module, getModule, Mutation } from 'vuex-module-decorators';
import BaseTabs from '@/components/BaseTabs.vue';
import store from '@/store/store';
import { VuexModule } from '@/store/utils';
import { Project } from './project';
import { Sample } from '@/core';

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

  @Mutation
  public setProject(project: Project) {
    this.project = project;
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
