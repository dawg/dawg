<template>
  <div class="text-xs-center">
    <v-dialog
      :value="value"
      width="500"
      @input="input"
      dark
      class="secondary"
    >
      <v-card>
        <v-card-title class="headline secondary">
          Available Projects
        </v-card-title>


        <v-list 
          class="secondary"
          v-if="projects.length"
        >
          <template v-for="(project, i) in projects">
            <v-list-tile
              :key="project.id"
              @click="openProject(project)"
              @contextmenu="context(project, $event)"
            >
              <v-list-tile-content>
                <v-list-tile-title>{{ project.name }}</v-list-tile-title>
              </v-list-tile-content>

              <v-list-tile-action>
                <v-list-tile-action-text>{{ project.lastUploadTime | dateConvert }}</v-list-tile-action-text>
              </v-list-tile-action>
            </v-list-tile>
            <v-divider
              v-if="i + 1 < projects.length"
              :key="i"
            ></v-divider>
          </template>
        </v-list>

        <v-card-text
          v-else
          class="secondary"
        >
          No available projects.
        </v-card-text>

      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { Watch } from '@/modules/update';
import * as dawg from '@/dawg';
import { ProjectInfo } from '@/dawg/extensions/extra/backup/backend';
import { createComponent, watch } from 'vue-function-api';

export default createComponent({
  filters: {
    dateConvert(epoch: number) {
      return new Date(epoch).toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      });
    },
  },
  props: {
    value: { type: Boolean, required: true },
    projects: { type: Array as () => ProjectInfo[], required: true },
  },
  setup(props, context) {
    function close() {
      context.emit('input', false);
    }

    let disposer: { dispose(): void } | null = null;
    watch(() => props.value, (value) => {
      if (disposer) {
        disposer.dispose();
        disposer = null;
      }

      if (value) {
        disposer = dawg.commands.registerCommand({
          text: 'Close Project Modal',
          shortcut: ['Esc'],
          callback: close,
        })
      }
    })

    return {
      context(project: ProjectInfo, event: MouseEvent) {
        dawg.menu.context({
          event,
          items: [
            {
              text: 'Delete',
              callback: () => {
                context.emit('delete', project);
              },
            },
          ],
        });
      },
      input(value: boolean) {
        context.emit('input', value);
      },
      openProject(project: ProjectInfo) {
        context.emit('open', project);
        close();
      },
    }
  }
})
</script>

<style lang="sass" scoped>
</style>