<template>
  <v-card dark class="settings secondary">
    <v-list class="secondary" style="padding-top: 20px">
      <v-list-tile v-for="(setting, i) in base.ui.settings" :key="i">

        <v-list-tile-title v-if="setting.type === 'boolean'">{{ setting.title }}</v-list-tile-title>
        
        <v-list-tile-action v-if="setting.title">
          <v-text-field
            v-if="setting.type === 'string'"
            class="text-field"
            :label="setting.title"
            v-model="setting.value.value"
            :disabled="setting.disabled ? setting.disabled.value : false"
          ></v-text-field>
          <v-switch
            v-if="setting.type === 'boolean'"
            v-model="setting.value.value"
            color="primary"
            :disabled="setting.disabled ? setting.disabled.value : false"
          ></v-switch>
          <v-select
            v-if="setting.type === 'select'"
            class="select"
            dense
            dark
            :label="setting.label"
            :items="setting.options"
            v-model="setting.value.value"
          ></v-select>
        </v-list-tile-action>

        <component v-else :is="setting"></component>

      </v-list-tile>

    </v-list>
  </v-card>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import * as base from '@/base';

@Component
export default class Settings extends Vue {
  public base = base;

  public close() {
    this.$emit('input', false);
  }
}
</script>

<style lang="sass" scoped>
.settings
  padding: 0 0 10px 0

.select /deep/ .v-input__slot
  margin: 0!important
  max-width: 250px

.select /deep/ .v-select__selections
  margin: 0!important
  max-width: 220px
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis

</style>