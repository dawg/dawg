import * as dawg from '@/dawg';
import * as t from '@/modules/io';
import { User } from 'firebase';
import backend, { ProjectInfo } from '@/dawg/extensions/extra/backup/backend';
import { ProjectType, IProject } from '@/project';
import { PathReporter } from 'io-ts/lib/PathReporter';
import auth from '@/dawg/extensions/extra/backup/auth';
import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/auth';
import { menubar } from '@/dawg/extensions/core/menubar';
import { computed, watch, ref, createComponent } from '@vue/composition-api';
import { ui } from '@/base/ui';
import { project } from '@/dawg/extensions/core/project';
import { createExtension } from '@/dawg/extensions';
import { vueExtend } from '@/utils';

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

    const user = ref<User | null>(null);
    const projects = ref<ProjectInfo[]>([]);
    // const item = dawg.ui.createStatusBarItem();
    const error = ref(false);
    const syncing = ref(false);

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

    const component = vueExtend(createComponent({
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

    const backup = context.workspace.backup;

    watch(backup, async () => {
      if (backup.value) {
        updateProject(await dawg.project.serializeProject());
      } else {
        backup.value = false;
      }
    });


    try {
      auth.watchUser({
        authenticated: (u) => {
          projects.value = [];
          user.value = u;
        },
        unauthenticated: () => {
          projects.value = [];
          user.value = null;
        },
      });
    } catch (e) {
      // Ignore this error, it means we can't connect to the server (ie. internet is down)
    }

    const open = {
      text: 'Open From Backup',
      callback: () => {
        openBackup();
      },
    };

    const file = menubar.getMenu('File');
    context.subscriptions.push(dawg.commands.registerCommand(open));
    context.subscriptions.push(file.addItem(open));

    context.subscriptions.push(dawg.commands.registerCommand({
      text: 'Delete Backup',
      callback: () => {
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
    }));

    context.subscriptions.push(dawg.project.onDidSave((encoded) => {
      if (backup.value) {
        updateProject(encoded);
      }
    }));

    const googleButton = vueExtend(createComponent({
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
            backup.value = false;
            projects.value = [];
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
          if (user.value) {
            return 'Sign Out';
          } else {
            return 'Sign in with Google';
          }
        });

        const signInOrSignOut = () => {
          if (user.value) {
            logout();
          } else {
            signIn();
          }
        };

        return {
          text,
          signInOrSignOut,
          authenticated: computed(() => !!user.value),
          name: computed(() => {
            if (user.value) {
              return user.value.displayName;
            }
          }),
        };
      },
    }));

    ui.settings.push(googleButton);
    ui.settings.push({
      title: 'Cloud Backup',
      description: 'Whether to sync this project to the cloud',
      type: 'boolean',
      value: backup,
      disabled: computed(() => {
        return !project.project.name || !user.value;
      }),
    });
  },
});
