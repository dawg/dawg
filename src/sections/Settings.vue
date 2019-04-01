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

      <v-list-tile>
          <v-list-tile-action>
          <v-select
            class="device-dropdown"
            dense
            dark
            label="Microphone"
            :items="devices"
            :value="cache.microphoneIn"
            @input="cache.setMicrophoneIn"
          ></v-select>
        </v-list-tile-action>
      </v-list-tile>

    </v-list>
  </v-card>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { Nullable } from '@/utils';
import { cache, workspace, general } from '@/store';
import auth from '@/auth';

@Component
export default class Settings extends Vue {
  public cache = cache;
  public workspace = workspace;
  public general = general;
  public devices: string[] = [];

  public mounted() {
    navigator.mediaDevices.enumerateDevices().then((media: MediaDeviceInfo[]) => {
      media.forEach((device: MediaDeviceInfo) => {
        if (device.kind === 'audioinput') {
          this.devices.push(device.label);
        }
      });
    });
  }

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

.device-dropdown /deep/ .v-input__slot
  margin: 0!important
  max-width: 250px

.device-dropdown /deep/ .v-select__selections
  margin: 0!important
  max-width: 220px
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis

</style>