import * as dawg from '@/dawg';
import { User } from 'firebase';
import * as t from 'io-ts';
import backend, { ProjectInfo } from '@/dawg/extensions/extra/backup/backend';
import { ProjectType, IProject } from '@/store/project';
import { PathReporter } from 'io-ts/lib/PathReporter';
import auth from '@/auth';

class BackupManager {
  private projects: ProjectInfo[] = [];
  private user: User | null = null;
  private item = dawg.ui.createStatusBarItem();
  private error = false;
  private syncing = false;
  private backup = false;

  constructor(private context: dawg.IExtensionContext<{}, {}, { backup: boolean }>) {
    this.context.subscriptions.push(this.item);
  }

  public setError(error: boolean) {
    this.error = error;
    this.setIcon();
  }

  public setSyncing(syncing: boolean) {
    this.syncing = syncing;
    this.setIcon();
  }

  public setBackup(backup: boolean) {
    this.backup = backup;
    this.setIcon();
  }

  public setIcon() {
    if (!this.backup) {
      this.item.text = 'cloud_off';
      this.item.tooltip = 'Cloud Backup Disabled';
    } else if (this.error) {
      this.item.text = 'error_outline';
      this.item.tooltip = 'Cloud Error';
    } else if (this.syncing) {
      this.item.text = 'cloud_queue';
      this.item.tooltip = 'Backup In Progress';
    } else {
      this.item.text = 'cloud_done';
      this.item.tooltip = 'Cloud Backup Enabled';
    }
  }

  public async loadProjects(user: User) {
    const res =  await backend.getProjects(user);

    if (res.type === 'success') {
      this.projects = res.projects;
    }

    if (res.type === 'error') {
      dawg.notify.error(res.message);
    }
  }

  public openBackup() {
    const projects: { [name: string]: ProjectInfo } = {};
    this.projects.forEach((project) => {
      projects[project.name] = project;
    });

    this.handleUnauthenticated(async (user) => {
      await this.loadProjects(user);
      dawg.palette.selectFromObject(projects, {
        placeholder: 'Available Projects',
        onDidSelect: (projectInfo) => {
          this.openProject(projectInfo);
        },
      });
    });
  }

  public async openProject(info: ProjectInfo) {
    this.handleUnauthenticated(async (user) => {
      const res = await backend.getProject(user, info.id);
      if (res.type === 'not-found') {
        dawg.notify.warning('Uh, we were unable to find your project');
        return;
      }

      if (res.type === 'error') {
        dawg.notify.error('Unable to get project', { detail: res.message });
        return;
      }

      const decoded = ProjectType.decode(res.project);
      if (decoded.isLeft()) {
        const errors = PathReporter.report(decoded);
        dawg.notify.error('Unable to parse project from backup', {
          detail: errors.join('\n'),
        });
      }

      dawg.project.openTempProject(decoded.value);
    });
  }

  public handleUnauthenticated(authenticated: (user: User) => void) {
    if (this.user === null) {
      dawg.notify.info('Please login first', { detail: 'Use the settings icon in the Activity Bar.' });
      return;
    }

    authenticated(this.user);
  }

  public deleteProject(info: ProjectInfo) {
    this.handleUnauthenticated(async (user) => {
      const res = await backend.deleteProject(user, info.id);

      if (res.type === 'success') {
        // We are not taking advantage of firebase here
        // Ideally firebase would send an event and we would update our project list
        // Until we do that, this will suffice
        this.projects = this.projects.filter((maybe) => maybe !== info);
      } else if (res.type === 'not-found') {
        dawg.notify.info(`Unable to delete ${info.name}`, { detail: 'The project was not found.' });
      } else {
        dawg.notify.info(`Unable to delete ${info.name}`, { detail: res.message });
      }
    });
  }

  public async updateProject(encoded: IProject) {
    if (this.context.settings.get('backup', false)) {
      return;
    }

    this.setSyncing(true);

    if (!this.user) {
      dawg.notify.info('Please sign in to backup a project.');
      return;
    }

    if (!encoded.name) {
      dawg.notify.info('Please give your project a name to backup.');
      return;
    }

    const backupStatus = await backend.updateProject(this.user, encoded.id, encoded);

    switch (backupStatus.type) {
      case 'error':
        dawg.notify.error('Unable to backup', { detail: backupStatus.message });
        this.setError(true);
        break;
      case 'success':
        // Make sure to set it back to false if there was an error previously
        this.setError(false);
        break;
    }

    this.setSyncing(false);
  }

  public setUser(user: User | null) {
    this.user = user;

    if (user === null) {
      this.projects = [];
    }
  }

  public dispose() {
    //
  }
}

export const extension: dawg.Extension<{}, {}, { backup: t.BooleanC }> = {
  id: 'dawg.backup',
  defineSettings() {
    return {
      backup: t.boolean,
    };
  },

  activate(context) {
    const manager = new BackupManager(context);
    manager.setBackup(context.settings.get('backup', false));

    context.subscriptions.push(context.settings.onDidChangeSettings((key, value) => {
      switch (key) {
        case 'backup':
          if (value) {
            manager.updateProject(dawg.project.serializeProject());
          } else {
            manager.setBackup(false);
          }
          break;
      }
    }));

    auth.watchUser({
      authenticated: (user) => {
        manager.setUser(user);
      },
      unauthenticated: () => {
        manager.setUser(null);
      },
    });

    // TODO Register menubar
    dawg.commands.registerCommand({
      text: 'Open From Backup',
      callback: () => {
        manager.openBackup();
      },
    });

    dawg.commands.registerCommand({
      text: 'Delete Backup',
      callback: () => {
        // TODO DELETE
        manager.openBackup();
      },
    });

    context.subscriptions.push(manager);

    context.subscriptions.push(dawg.project.onDidSave((encoded) => {
      manager.updateProject(encoded);
    }));
  },

  deactivate() {
    //
  },
};
