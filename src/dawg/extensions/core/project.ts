import tmp from 'tmp';
import fs from 'mz/fs';
import { Sample, ScheduledSample } from '@/core';
import { Beats } from '@/core/types';
import { general, workspace } from '@/store';
import { IProject, Project, ProjectType } from '@/store/project';
import { Extension } from '@/dawg/extensions';
// TODO(jacob) Wrap
import { remote } from 'electron';
import { manager } from '@/dawg/extensions/manager';
import { InitializationError, InitializationSuccess } from '@/store/general';
import { MemoryLoader } from '@/core/loaders/memory';
import { notify } from './notify';
import { DG_EXTENSION, FILTERS } from '@/constants';
import { commands, Command } from './commands';
import { menubar } from './menubar';
import { computed } from 'vue-function-api';
import { patterns } from './patterns';
import { emitter, EventProvider } from '@/dawg/events';

const projectApi = () => {
  // tslint:disable-next-line:variable-name
  let _p: Project | null = null;
  const events = emitter<{ playPause: () => void }>();

  const transport = computed(() => {
    // TODO NOW
    if (workspace.applicationContext === 'pianoroll') {
      const pattern = patterns.selectedPattern;
      return pattern.value ? pattern.value.transport : null;
    } else {
      return general.project.master.transport;
    }
  });

  const get = async () => {
    if (!_p) {
      const result = await loadProject();
      if (result.type === 'error') {
        notify.info('Unable to load project.', { detail: result.message, duration: Infinity });
      }

      _p = result.project;
    }


    return _p;
  };

  async function scheduleMaster(sample: Sample, row: number, time: Beats) {
    (await get()).samples.push(sample);

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

  async function openTempProject(p: IProject) {
    const { name } = tmp.fileSync({ keep: true });
    await fs.writeFile(name, JSON.stringify(p, null, 4));

    // TODO
    // dawg.log.info(`Writing ${name} as backup`);
    manager.setOpenedFile({ path: name, id: p.id }, { isTemp: true });

    const window = remote.getCurrentWindow();
    window.reload();
  }

  function onDidSave(cb: (encoded: IProject) => void) {
    return {
      dispose() {
        // TODO(jacob)
      },
    };
  }

  async function serializeProject() {
    return (await get()).serialize();
  }

  async function getProject() {
    return await get();
  }

  function getOpenedFile() {
    return manager.getOpenedFile();
  }

  async function saveProject(opts: { forceDialog?: boolean }) {
    const p = await get();

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

  async function removeOpenedFile() {
    await manager.setOpenedFile(undefined);
  }

  async function setOpenedFile(path: string) {
    await manager.setOpenedFile({
      path,
      id: (await get()).id,
    });
  }

  function playPause() {
    if (!transport.value) {
      notify.warning('Please select a Pattern.', {
        detail: 'Please create and select a Pattern first or switch the Playlist context.',
      });
      return;
    }

    // TODO(jacob) refactor
    if (transport.value.state === 'started') {
      transport.value.stop();
      general.pause();
    } else {
      transport.value.start();
      general.start();
    }
  }

  return {
    scheduleMaster,
    openTempProject,
    onDidSave,
    serializeProject,
    getProject,
    getOpenedFile,
    saveProject,
    removeOpenedFile,
    setOpenedFile,
    playPause,
    getTime() {
      // TODO FINISH
      return 0;
    },
    startTransport() {
      if (!transport.value) {
        return;
      }

      transport.value.start();
      general.start();
      events.emit('playPause');
    },
    stopIfStarted() {
      if (transport.value && transport.value.state === 'started') {
        this.stopTransport();
      }
    },
    stopTransport() {
      if (!transport.value) {
        return;
      }

      transport.value.stop();
      general.pause();
      events.emit('playPause');
    },
    onDidPlayPause(cb: () => void) {
      return new EventProvider(events, 'playPause', cb);
    },
  };
};

async function loadProject(): Promise<InitializationError | InitializationSuccess> {
  const projectJSON = manager.getProjectJSON();

  if (!projectJSON) {
    return {
      type: 'success',
      project: Project.newProject(),
    };
  }

  const loader = new MemoryLoader(ProjectType, { data: projectJSON });
  const result = loader.load();
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

const extension: Extension<{}, {}, {}, ReturnType<typeof projectApi>> = {
  id: 'dawg.project',
  activate(context) {
    const api = projectApi();

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

    const open: Command = {
      text: 'Open',
      shortcut: ['CmdOrCtrl', 'O'],
      callback: async () => {
        // files can be undefined. There is an issue with the .d.ts files.
        const files = remote.dialog.showOpenDialog(
          remote.getCurrentWindow(),
          { filters: FILTERS, properties: ['openFile'] },
        );

        // TODO(jacob)
        // the showFileDialog messes with the keyup events
        // This is a temporary solution
        commands.clear();

        if (!files) {
          return;
        }

        const filePath = files[0];
        await api.setOpenedFile(filePath);

        // TODO use function
        const window = remote.getCurrentWindow();
        window.reload();
      },
    };

    const newProject: Command = {
      shortcut: ['CmdOrCtrl', 'N'],
      text: 'New Project',
      callback: async () => {
        await api.removeOpenedFile();

        // TODO use function
        const window = remote.getCurrentWindow();
        window.reload();
      },
    };

    const toDispose = [save, saveAs, open, newProject].map((command) => {
      context.subscriptions.push(commands.registerCommand(command));
      return menubar.addItem('File', command);
    });

    context.subscriptions.push(...toDispose);
    context.subscriptions.push(commands.registerCommand({
      text: 'Play/Pause',
      shortcut: ['Space'],
      callback: api.playPause,
    }));

    return api;
  },

  deactivate() {
    window.removeEventListener('online', online);
  },
};

export const project = manager.activate(extension);
