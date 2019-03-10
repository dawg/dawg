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
import { ProjectInfo } from '@/backend';

@Component({
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
})
export default class ProjectModal extends Vue {
  @Prop({ type: Boolean, required: true }) public value!: boolean;
  @Prop({ type: Array, required: true }) public projects!: ProjectInfo[];

  public close() {
    this.$emit('input', false);
  }

  public input(value: boolean) {
    this.$emit('input', value);
  }

  public openProject(project: ProjectInfo) {
    this.$emit('open', project);
    this.close();
  }
}
</script>

<style lang="sass" scoped>
</style>