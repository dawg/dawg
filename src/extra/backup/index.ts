import * as dawg from '@/dawg';
import Vue from 'vue';
import * as t from '@/lib/io';
import { User } from 'firebase';
import backend, { ProjectInfo } from '@/extra/backup/backend';
import auth from '@/extra/backup/auth';
import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/auth';
import { menubar } from '@/core/menubar';
import { computed, watch, ref, createComponent } from '@vue/composition-api';
import * as framework from '@/lib/framework';
import { project, ProjectType, IProject } from '@/core/project';
import { createExtension } from '@/lib/framework/extensions';
import { copy } from '@/lib/std';

export const extension = createExtension({
  id: 'dawg.backup',
  workspace: {
    backup: {
      type: t.boolean,
      default: false,
    },
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

    const user = ref<User>();
    const projects = ref<ProjectInfo[]>([]);
    const error = ref<string>();
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

    const tooltip = computed((): string => {
      if (!backup.value) {
        return 'Cloud Backup Disabled';
      } else if (error.value) {
        return error.value;
      } else if (syncing.value) {
        return 'Backup In Progress';
      } else {
        return 'Cloud Backup Enabled';
      }
    });

    // flex centers the icons which is why we add it
    const component = Vue.extend(createComponent({
      props: {},
      template: `
      <dg-mat-icon
        v-if="error"
        class="flex text-default text-sm"
        title="Cloud Backup Error"
        icon="error_outline"
      ></dg-mat-icon>

      <dg-spinner
        v-else-if="syncing"
        class="flex text-default w-4 h-4"
        title="Syncing Backup"
      ></dg-spinner>

      <dg-mat-icon
        v-else
        class="flex text-default text-sm"
        :icon="icon"
        :title="tooltip"
      ></dg-mat-icon>
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

    framework.ui.statusBar.push({
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

    function backupAction(mode: 'open' | 'delete') {
      handleUnauthenticated(async (u) => {
        await loadProjects(u);
        const projectLookup: { [name: string]: ProjectInfo } = {};
        projects.value.forEach((p) => {
          projectLookup[p.name] = p;
        });

        dawg.palette.selectFromObject(projectLookup, {
          placeholder: 'Available Projects',
          onDidInput: (projectInfo) => {
            switch (mode) {
              case 'delete':
                deleteProject(projectInfo);
                break;
              case 'open':
                openProject(projectInfo);
                break;
            }
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
          dawg.notify.error('Unable to get project', { detail: res.message, duration: Infinity });
          return;
        }

        const result = dawg.io.decodeItem(ProjectType, res.project);
        if (result.type === 'error') {
          dawg.notify.error('Unable to parse project from backup', {
            detail: result.message,
            duration: Infinity,
          });
          return;
        }

        dawg.project.openTempProject(result.decoded);
      });
    }

    function handleUnauthenticated(authenticated: (user: User) => void) {
      if (!user.value) {
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
      if (!backup.value) {
        return;
      }

      if (!user.value) {
        return;
      }

      if (encoded.name === '') {
        dawg.notify.info('Please give your project a name to backup.');
        return;
      }

      syncing.value = true;

      // Copy because we can't upload undefined values to firebase
      // Copying will remove these key/value pairs
      const copyOfProject = copy(encoded);
      const backupStatus = await backend.updateProject(user.value, encoded.id, copyOfProject);

      switch (backupStatus.type) {
        case 'error':
          dawg.notify.error('Unable to backup', { detail: backupStatus.message, duration: Infinity });
          error.value = 'Unable to backup';
          break;
        case 'success':
          // Make sure to set it back to false if there was an error previously
          error.value = undefined;
          break;
      }

      // Just so the upload is always perceivable to the user!
      setTimeout(() => syncing.value = false, 1000);
    }

    const backup = context.workspace.backup;

    watch([backup, user], async () => {
      updateProject(await dawg.project.serialize());
    });


    try {
      auth.watchUser({
        authenticated: (u) => {
          projects.value = [];
          user.value = u;
        },
        unauthenticated: () => {
          projects.value = [];
          user.value = undefined;
        },
      });
    } catch (e) {
      // Ignore this error, it means we can't connect to the server (ie. internet is down)
    }

    const open = {
      text: 'Open From Backup',
      callback: () => backupAction('open'),
    };

    const file = menubar.getMenu('File');
    context.subscriptions.push(dawg.commands.registerCommand(open));
    context.subscriptions.push(file.addItem(open));

    context.subscriptions.push(dawg.commands.registerCommand({
      text: 'Delete Backup',
      callback: () => backupAction('delete'),
    }));

    context.subscriptions.push(dawg.project.onDidSave(updateProject));

    const googleButton = Vue.extend(createComponent({
      props: {},
      template: `
      <div>
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
        };
      },
    }));

    const name = computed(() => {
      if (user.value) {
        return user.value.displayName;
      }
    });

    context.settings.push({
      label: 'Google Login',
      description: computed(() => {
        if (name.value) {
          return `Currently logged in as \`${name.value}\``;
        } else {
          return `Login with google.`;
        }
      }),
      type: 'component',
      component: googleButton,
    });

    const projectName = project.name;
    const either = computed(() => !projectName.value || !user.value);
    const both = computed(() => !projectName.value && !user.value);

    const description = computed(() => {
      let value = 'Whether to sync this project to the cloud.';

      if (either.value) {
        value += ' Before you can enable this, please ';
      }

      if (!project.name.value) {
        value += 'give your project a name';
      }

      if (both.value) {
        value += ' and ';
      }

      if (!user.value) {
        value += 'login using your Google Account';
      }

      if (either.value) {
        value += '.';
      }

      return value;
    });

    context.settings.push({
      label: 'Cloud Backup',
      description,
      type: 'boolean',
      value: backup,
      disabled: either,
      checkedValue: 'Syncing',
      uncheckedValue: 'Not Syncing',
    });
  },
});
