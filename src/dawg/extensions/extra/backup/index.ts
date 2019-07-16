import * as dawg from '@/dawg';
import * as t from 'io-ts';
import { User } from 'firebase';
import Vue from 'vue';
import ProjectModal from '@/dawg/extensions/extra/backup/ProjectModal.vue';
import backend, { ProjectInfo } from '@/dawg/extensions/extra/backup/backend';
import { ProjectType, IProject } from '@/project';
import { PathReporter } from 'io-ts/lib/PathReporter';
import auth from '@/dawg/extensions/extra/backup/auth';
import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/auth';
import { menubar } from '@/dawg/extensions/core/menubar';
import { computed, watch, Wrapper, value, createComponent } from 'vue-function-api';
import { ui } from '@/dawg/ui';
import { project } from '../../core/project';
import { createExtension } from '../..';

const createBackupAPI = (
  backup: Wrapper<boolean>,
) => {
  const user = value<User | null>(null);
  const projects = value<ProjectInfo[]>([]);
  // const item = dawg.ui.createStatusBarItem();
  const error = value(false);
  const syncing = value(false);

  const icon = computed(() => {
    if (!backup.value) {
      return 'cloud_off';
    } else if (error.value) {
      return 'error_outline';
    } else if (syncing.value) {
      return 'cloud_queue';
    } else {
      return 'cloud_done';
    }
  });

  const tooltip = computed(() => {
    if (!backup.value) {
      return 'Cloud Backup Disabled';
    } else if (error.value) {
      return 'Cloud Error';
    } else if (syncing.value) {
      return 'Backup In Progress';
    } else {
      return 'Cloud Backup Enabled';
    }
  });

  const component = Vue.extend(createComponent({
    template: `
    <tooltip-icon
      v-if="error"
      :color="theme.foreground"
      size="18"
      tooltip="Cloud Backup Error"
      top
      left
    >
      error_outline
    </tooltip-icon>

    <v-progress-circular
      v-else-if="syncing"
      :size="15"
      :width="2"
      indeterminate
    ></v-progress-circular>

    <v-icon v-else :color="theme.foreground" size="20">
      {{ icon }}
    </v-icon>
    `,
    setup() {
      return {
        icon,
        tooltip,
        syncing,
        theme: dawg.theme,
        error,
      };
    },
  }));

  ui.statusBar.push({
    component,
    position: 'right',
    order: 1,
  });

  async function loadProjects(u: User) {
    const res =  await backend.getProjects(u);

    if (res.type === 'success') {
      projects.value = res.projects;
    }

    if (res.type === 'error') {
      dawg.notify.error(res.message);
    }
  }

  function resetProjects() {
    projects.value = [];
  }

  function openBackup() {
    handleUnauthenticated(async (u) => {
      await loadProjects(u);
      const projectLookup: { [name: string]: ProjectInfo } = {};
      projects.value.forEach((p) => {
        projectLookup[p.name] = p;
      });

      dawg.palette.selectFromObject(projectLookup, {
        placeholder: 'Available Projects',
        onDidSelect: (projectInfo) => {
          openProject(projectInfo);
        },
      });
    });
  }

  async function openProject(info: ProjectInfo) {
    handleUnauthenticated(async (u) => {
      const res = await backend.getProject(u, info.id);
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
        return;
      }

      dawg.project.openTempProject(decoded.value);
    });
  }

  function handleUnauthenticated(authenticated: (user: User) => void) {
    if (user.value === null) {
      dawg.notify.info('Please login first', { detail: 'Use the settings icon in the Activity Bar.' });
      return;
    }

    authenticated(user.value);
  }

  function deleteProject(info: ProjectInfo) {
    handleUnauthenticated(async (u) => {
      const res = await backend.deleteProject(u, info.id);

      if (res.type === 'success') {
        // We are not taking advantage of firebase here
        // Ideally firebase would send an event and we would update our project list
        // Until we do that, this will suffice
        projects.value = projects.value.filter((maybe) => maybe !== info);
      } else if (res.type === 'not-found') {
        dawg.notify.info(`Unable to delete ${info.name}`, { detail: 'The project was not found.' });
      } else {
        dawg.notify.info(`Unable to delete ${info.name}`, { detail: res.message });
      }
    });
  }

  async function updateProject(encoded: IProject) {
    if (backup.value) {
      return;
    }

    syncing.value = true;

    if (!user.value) {
      dawg.notify.info('Please sign in to backup a project.');
      return;
    }

    if (encoded.name === '') {
      dawg.notify.info('Please give your project a name to backup.');
      return;
    }

    const backupStatus = await backend.updateProject(user.value, encoded.id, encoded);

    switch (backupStatus.type) {
      case 'error':
        dawg.notify.error('Unable to backup', { detail: backupStatus.message });
        error.value = true;
        break;
      case 'success':
        // Make sure to set it back to false if there was an error previously
        error.value = false;
        break;
    }

    syncing.value = false;
  }

  function setUser(u: User | null) {
    user.value = u;

    if (user === null) {
      projects.value = [];
    }
  }

  return {
    loadProjects,
    resetProjects,
    openBackup,
    deleteBackup: () => {
      // FIXME duplicate code
      handleUnauthenticated(async (u) => {
        await loadProjects(u);
        const projectLookup: { [name: string]: ProjectInfo } = {};
        projects.value.forEach((p) => {
          projectLookup[p.name] = p;
        });

        dawg.palette.selectFromObject(projectLookup, {
          placeholder: 'Available Projects',
          onDidSelect: (projectInfo) => {
            deleteProject(projectInfo);
          },
        });
      });
    },
    openProject,
    handleUnauthenticated,
    deleteProject,
    updateProject,
    setUser,
    user,
    backup,
    projects,
  };
};

export const extension = createExtension({
  id: 'dawg.backup',
  workspace: {
    backup: t.boolean,
  },
  workspaceDefaults: {
    backup: false,
  },
  activate(context) {

    firebase.initializeApp({
      apiKey: 'AIzaSyCg8BcL3EbQpOpXFLwMx4h6XmdKtStVKhU',
      authDomain: 'dawg-backup.firebaseapp.com',
      databaseURL: 'https://dawg-backup.firebaseio.com',
      projectId: 'dawg-backup',
      storageBucket: 'dawg-backup.appspot.com',
      messagingSenderId: '540203128797',
    });

    const backup = context.workspace.backup;

    watch(backup, async () => {
      if (backup.value) {
        manager.updateProject(await dawg.project.serializeProject());
      } else {
        backup.value = false;
      }
    });

    const manager = createBackupAPI(backup);

    auth.watchUser({
      authenticated: (user) => {
        manager.setUser(user);
      },
      unauthenticated: () => {
        manager.setUser(null);
      },
    });

    const open = {
      text: 'Open From Backup',
      callback: () => {
        manager.openBackup();
      },
    };

    dawg.commands.registerCommand(open);
    menubar.addItem('File', open);

    dawg.commands.registerCommand({
      text: 'Delete Backup',
      callback: () => {
        manager.deleteBackup();
      },
    });

    context.subscriptions.push(dawg.project.onDidSave((encoded) => {
      manager.updateProject(encoded);
    }));

    const component = Vue.extend(createComponent({
      template: `
      <div>
        <div
          v-if="authenticated"
          style="font-size: 0.9em; padding: 5px 0px; color: rgba(255, 255, 255, 0.7)"
        >
          Signed in as {{ name }}
        </div>
        <google-button @click="signInOrSignOut">
          {{ text }}
        </google-button>
      </div>
      `,
      setup() {
        const logout = () => {
          try {
            auth.logout();
            manager.backup.value = false;
            manager.resetProjects();
          } catch (e) {
            dawg.notify.error('Unable to sign out of Google.', { detail: e.message });
          }
        };

        const signIn = () => {
          try {
            auth.signIn();
          } catch (e) {
            dawg.notify.error('Unable to sign into Google.', { detail: e.message });
          }
        };

        const text = computed(() => {
          if (manager.user.value) {
            return 'Sign Out';
          } else {
            return 'Sign in with Google';
          }
        });

        const signInOrSignOut = () => {
          if (manager.user.value) {
            logout();
          } else {
            signIn();
          }
        };

        return {
          text,
          signInOrSignOut,
          authenticated: computed(() => !!manager.user.value),
          name: computed(() => {
            if (manager.user.value) {
              return manager.user.value.displayName;
            }
          }),
        };
      },
    }));

    ui.settings.push(component);
    ui.settings.push({
      title: 'Cloud Backup',
      description: 'Whether to sync this project to the cloud',
      type: 'boolean',
      value: manager.backup,
      disabled: computed(() => {
        return !project.project.name || !manager.user.value;
      }),
    });

    return manager;
  },
});
