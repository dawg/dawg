<template>
  <v-card dark class="settings secondary">
    <v-list class="secondary" style="padding-top: 20px">

      <v-list-tile-sub-title 
        v-if="general.authenticated"
        style="font-size: 0.9em; padding: 5px 15px;"
      >
        Signed in as {{ name }}
      </v-list-tile-sub-title>
      
      <v-list-tile>
        <google-button
          @click="signInOrSignOut"
        >
          {{ text }}
        </google-button>
      </v-list-tile>

      

      <v-divider
        style="margin: 20px 0 10px"
      ></v-divider>

      <v-list-tile>
        <v-list-tile-action class="action">
          <v-text-field 
            class="text-field"
            label="Project Name"
            v-model="general.project.name"
          ></v-text-field>
        </v-list-tile-action>
      </v-list-tile>

      <v-list-tile>
        <v-list-tile-action class="action">
          <v-text-field 
            class="text-field"
            label="Python Path"
            :python-path="workspace.pythonPath"
            @input="workspace.setPythonPath"
          ></v-text-field>
        </v-list-tile-action>
      </v-list-tile>

      <v-list-tile>
        <v-list-tile-action class="action">
          <v-text-field 
            class="text-field"
            label="Models Path"
            :models-path="workspace.modelsPath"
            @input="workspace.setModelsPath"
          ></v-text-field>
        </v-list-tile-action>
      </v-list-tile>

      <v-list-tile>
        <v-list-tile-title>Cloud Backup</v-list-tile-title>
        <v-list-tile-action>
          <v-switch 
            :input-value="workspace.backup"
            color="primary"
            :disabled="!general.project.name || !general.authenticated"
            @change="workspace.setBackup"
          ></v-switch>
        </v-list-tile-action>
      </v-list-tile>

    </v-list>
  </v-card>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { Nullable } from '@/utils';
import { workspace, general } from '@/store';
import auth from '@/auth';

@Component
export default class Settings extends Vue {
  public workspace = workspace;
  public general = general;

  get text() {
    if (general.authenticated) {
      return 'Sign Out';
    } else {
      return 'Sign in with Google';
    }
  }

  get name() {
    if (general.user) {
      return general.user.displayName;
    }
  }

  public signInOrSignOut() {
    if (general.authenticated) {
      this.logout();
    } else {
      this.signIn();
    }
  }

  public async logout() {
    try {
      auth.logout();
      general.setProjects([]);
      workspace.setBackup(false);
    } catch (e) {
      this.$notify.error('Unable to sign out of Google.', { detail: e.message });
    }
  }

  public async signIn() {
    try {
      auth.signIn();
    } catch (e) {
      this.$notify.error('Unable to sign into Google.', { detail: e.message });
    }
  }

  public close() {
    this.$emit('input', false);
  }
}
</script>

<style lang="sass" scoped>
.action
  width: 100%

.settings
  padding: 0 0 10px 0
</style>