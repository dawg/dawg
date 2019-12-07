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
          <div class="section" v-for="(section, i) in processed" :key="i">
            <h1 class="section-title">{{ section.title }}</h1>
            <div v-for="setting in section.settings" :key="setting.label">
              <label class="setting-label">{{ setting.label }}</label>
              <div class="description" v-html="setting.description"></div>
              <dg-text-field
                class="max-w-full text-field"
                v-if="setting.type === 'string'"
                :color="dawg.theme.foreground"
                v-model="setting.value.value"
                :disabled="setting.disabled ? setting.disabled.value : false"
              ></dg-text-field>
              <v-switch
                v-else-if="setting.type === 'boolean'"
                v-model="setting.value.value"
                color="primary"
                :disabled="setting.disabled ? setting.disabled.value : false"
              ></v-switch>
              <v-select
                v-else-if="setting.type === 'select'"
                class="select"
                dense
                :items="setting.options"
                v-model="setting.value.value"
                :disabled="setting.disabled ? setting.disabled.value : false"
              ></v-select>
              <component v-else-if="setting.type === 'component'" :is="setting.component"></component>
            </div>
          </div>

        </div>
      </div>

    </div>
  </div>
</template>

<script lang="ts">
import * as base from '@/base';
import { Marked } from 'marked-ts';
import * as dawg from '@/dawg';
import { createComponent, watch, computed } from '@vue/composition-api';

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

    const processed = computed(() => {
      return dawg.manager.settings.map(({ title, settings }) => {
        return {
          title,
          settings: settings.map((setting): typeof setting => {
            return {
              ...setting,
              description: Marked.parse(setting.description),
            };
          }),
        };
      }).filter((section) => section.settings.length > 0).sort((a, b) => {
        return a.title.localeCompare(b.title);
      });
    });

    return {
      base,
      dawg,
      close: () => {
        if (dispose) {
          dispose();
        }

        context.emit('input', false);
      },
      processed,
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
  overflow: scroll;
  padding: 30px 0;
  background-color: rgba(0, 0, 0, 0.5);
}

.description, 
.section-title,
.setting-label {
  color: var(--foreground)!important;
}

.setting-label {
  font-weight: 600;
  font-size: 18px;
}

.section-title {
  font-size: 30px;
}

.modal-title {
  font-weight: 300;
  font-size: 14px;
}

.model.fade .modal-dialog {
  transition: transform .3s ease-out,-webkit-transform .3s ease-out,-o-transform .3s ease-out;
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