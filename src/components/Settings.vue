<template>
  <div v-if="value" class="modal fade in" role="dialog">
    <div class="modal-dialog">

      <!-- Modal content-->
      <div class="modal-content secondary">
        <div class="modal-header">
          <h4 class="modal-title foreground--text">Settings</h4>
          <div style="flex: 1"></div>
          <v-icon small @click="close" :color="base.theme.foreground">close</v-icon>
        </div>
        <div class="modal-body">
          <v-tabs v-model="tab" class="tabs" :color="base.theme.secondary">
            <v-tab>Workspace</v-tab>
            <v-tab>Global</v-tab>
          </v-tabs>
          
          <v-tabs-items v-model="tab">
            <v-tab-item>
              Hello Workspace
            </v-tab-item>
            <v-tab-item>
              Hello Global
            </v-tab-item>
          </v-tabs-items>

        </div>
      </div>

    </div>
  </div>
  <!-- <v-card dark class="settings secondary">
    <v-list class="secondary" style="padding-top: 20px">
      <v-list-item v-for="(setting, i) in base.ui.settings" :key="i">

        <v-list-item-title v-if="setting.type === 'boolean'">{{ setting.title }}</v-list-item-title>
        
        <v-list-item-action v-if="setting.title">
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
        </v-list-item-action>

        <component v-else :is="setting"></component>

      </v-list-item>

    </v-list>
  </v-card> -->
</template>

<script lang="ts">
import * as base from '@/base';
import * as dawg from '@/dawg';
import { createComponent, watch } from '@vue/composition-api';

export default createComponent({
  name: 'Settings',
  props: {
    value: { type: Boolean, required: true },
  },
  setup(props, context) {
    let dispose: (() => void) | undefined;
    watch(() => {
      if (props.value) {
        if (dispose) {
          dispose();
        }

        dispose = dawg.commands.registerShortcut({
          shortcut: ['Esc'],
          callback: () => {
            context.emit('input', false);
          },
        }).dispose;
      }
    });

    return {
      base,
      tab: 0,
      close: () => {
        if (dispose) {
          dispose();
        }

        context.emit('input', false);
      },
    };
  },
});
</script>

<style lang="scss" scoped>
.modal {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1050;
}

.modal-title {
  font-weight: 300;
  font-size: 14px;
}

.model.fade .modal-dialog {
  transition: transform .3s ease-out,-webkit-transform .3s ease-out,-o-transform .3s ease-out;
}

.tabs ::v-deep .v-tabs__slider {
  background-color: var(--foreground)!important;
}

.modal-dialog {
  position: relative;
  width: 600px;
  margin: auto;
}

.modal-header {
  padding: 15px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e5e5e5;
}

.modal-body {
  position: relative;
  padding: 0 15px;
}

.modal-content {
  position: relative;
  background-color: #fff;
  background-clip: padding-box;
  border: 1px solid #999;
  border: 1px solid rgba(0,0,0,.2);
  border-radius: 6px;
  box-shadow: 0 3px 9px rgba(0,0,0,.5);
  outline: 0;
}

.fade.in {
  opacity: 1;
}

.fade {
  transition: opacity .15s linear;
}

.settings {
  padding: 0 0 10px 0;
}

.select /deep/ .v-input__slot {
  margin: 0!important;
  max-width: 250px;
}

.select /deep/ .v-select__selections {
  margin: 0!important;
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

</style>