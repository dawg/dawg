import tmp from 'tmp';
import fs from 'mz/fs';
import { Sample, ScheduledSample } from '@/core';
import { Beats } from '@/core/types';
import { general } from '@/store';
import { IProject, Project, ProjectType } from '@/store/project';
import { Extension } from '@/dawg/extensions';
// TODO(jacob) Wrap
import { remote } from 'electron';
import { manager } from '../manager';
import { InitializationError, InitializationSuccess } from '@/store/general';
import { MemoryLoader } from '@/core/loaders/memory';
import { notify } from './notify';
import { DG_EXTENSION } from '@/constants';
import { commands, Command } from './commands';
import { menubar } from './menubar';

class ProjectAPI {
  private project: Project | null = null;

  public scheduleMaster(sample: Sample, row: number, time: Beats) {
    general.project.samples.push(sample);

    const scheduled = new ScheduledSample(sample, {
      type: 'sample',
      sampleId: sample.id,
      duration: sample.beats,
      row,
      time,
    });

    scheduled.schedule(general.project.master.transport);
    general.project.master.elements.push(scheduled);
  }

  public async openTempProject(p: IProject) {
    const { name } = tmp.fileSync({ keep: true });
    await fs.writeFile(name, JSON.stringify(p, null, 4));

    // TODO
    // dawg.log.info(`Writing ${name} as backup`);
    manager.setOpenedFile({ path: name, id: p.id }, { isTemp: true });

    const window = remote.getCurrentWindow();
    window.reload();
  }

  public onDidSave(cb: (encoded: IProject) => void) {
    return {
      dispose() {
        // TODO(jacob)
      },
    };
  }

  public serializeProject() {
    return general.project.serialize();
  }

  public getProject() {
    return general.project;
  }

  public getOpenedFile() {
    return manager.getOpenedFile();
  }

  public async saveProject(opts: { forceDialog?: boolean }) {
    const p = await this.getOrCreateProject();

    let projectPath = manager.getOpenedFile();
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
      manager.setOpenedFile({ path: projectPath, id: p.id });
    }

    const encoded = p.serialize();

    await fs.writeFile(projectPath, JSON.stringify(encoded, null, 4));
  }

  public async removeOpenedFile() {
    await manager.setOpenedFile(undefined);
  }

  public async setOpenedFile(path: string) {
    await manager.setOpenedFile({
      path,
      id: this.getProject().id,
    });
  }

  private async getOrCreateProject() {
    if (this.project === null) {
      const result = await loadProject();
      if (result.type === 'error') {
        notify.info('Unable to load project.', { detail: result.message, duration: Infinity });
      }

      this.project = result.project;
    }

    return this.project;
  }
}

async function loadProject(): Promise<InitializationError | InitializationSuccess> {
  const projectJSON = manager.getProjectJSON();

  if (!projectJSON) {
    return {
      type: 'success',
      project: Project.newProject(),
    };
  }

  const loader = new MemoryLoader(ProjectType, { data: projectJSON });
  const result = await loader.load();
  if (result.type === 'error') {
    return {
      type: 'error',
      message: result.message,
      project: Project.newProject(),
    };
  }

  const loaded = await Project.load(result.decoded);
  return {
    type: 'success',
    project: loaded,
  };
}

const online = () => {
  general.project.instruments.forEach((instrument) => {
    instrument.online();
  });
};

const extension: Extension<{}, {}, {}, ProjectAPI> = {
  id: 'dawg.project',
  activate(context) {
    const api = new ProjectAPI();

    window.addEventListener('online', online);

    const save: Command = {
      text: 'Save',
      shortcut: ['CmdOrCtrl', 'S'],
      callback: async () => {
        await api.saveProject({
          forceDialog: false,
        });
      },
    };

    const saveAs: Command = {
      text: 'Save',
      shortcut: ['CmdOrCtrl', 'Shift', 'S'],
      callback: async () => {
        await api.saveProject({
          forceDialog: true,
        });
      },
    };

    const toDispose = [save, saveAs].map((command) => {
      context.subscriptions.push(commands.registerCommand(command));
      return menubar.addItem('File', command);
    });

    context.subscriptions.push(...toDispose);

    return api;
  },

  deactivate() {
    window.removeEventListener('online', online);
  },
};

export const project = manager.activate(extension);
