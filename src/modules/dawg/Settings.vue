<template>
  <v-card dark class="settings secondary">
    <v-list class="secondary">
      <v-list-tile avatar>
        <v-list-tile-content>
          <v-list-tile-title>Settings</v-list-tile-title>
        </v-list-tile-content>
      </v-list-tile>
    </v-list>

    <v-divider></v-divider>

    <v-list class="secondary">
      <v-list-tile>
        <v-list-tile-action class="action">
          <v-text-field 
            class="text-field"
            label="Project Name"
            :value="name"
            @input="updateName"
          ></v-text-field>
        </v-list-tile-action>
      </v-list-tile>

      <v-list-tile>
        <v-list-tile-title>Cloud Backup</v-list-tile-title>
        <v-list-tile-action>
          <v-switch 
            :input-value="backup"
            color="primary"
            :disabled="!name"
            @change="updateCloud"
          ></v-switch>
        </v-list-tile-action>
      </v-list-tile>

    </v-list>
  </v-card>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { Nullable } from '@/utils';

@Component
export default class Settings extends Vue {
  @Prop(Nullable(String)) public name!: string;
  @Prop({ type: Boolean, required: true }) public backup!: boolean;

  public close() {
    this.$emit('input', false);
  }

  public openInfo() {
    this.$notify.warning('Not Implemented Yet');
  }

  public updateName(name: string) {
    this.$update('name', name);
  }

  public updateCloud(backup: boolean) {
    this.$update('backup', backup);
  }
}
</script>

<style lang="sass" scoped>
.action
  width: 100%

.settings
  padding: 0 0 10px 0
</style>