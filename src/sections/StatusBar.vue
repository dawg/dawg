<template>
  <div class="primary footer position foreground--text" :style="style">
    
    <v-tooltip top>
      <div slot="activator" class="name item">{{ projectName }}</div>
      <div>Project Name</div>
    </v-tooltip>

    <spectrogram
      class="item"
      :color="iconColor"
    ></spectrogram>

    <status-text class="item status-text"></status-text>

    <component
      v-for="(component, i) in onLeft"
      :key="i"
      :is="component"
    ></component>

    <div style="flex: 1"></div>

    <!-- TODO Remove margin -->
    <component
      v-for="(component, i) in onRight"
      :key="i"
      :is="component"
      style="margin: 0 35px"
    ></component>

    <tooltip-icon
      v-if="general.backupError" 
      :color="iconColor" 
      size="18" 
      tooltip="Cloud Backup Error"
      top
      left
    >
      error_outline
    </tooltip-icon>

    <v-progress-circular
      v-else-if="general.syncing"
      :size="15"
      :width="2"
      indeterminate
    ></v-progress-circular>

    <v-icon v-else :color="iconColor" size="20">
      {{ icon }}
    </v-icon>
  </div>
</template>

<script lang="ts">
import path from 'path';
import { Component, Vue, Prop } from 'vue-property-decorator';
import { cache, workspace, general } from '@/store';
import * as dawg from '@/dawg';

@Component
export default class Foot extends Vue {
  @Prop({ type: Number, required: true }) public height!: number;
  public general = general;

  get iconColor() {
    return dawg.theme.foreground;
  }

  get onRight() {
    return dawg.ui.statusBarRight;
  }

  get onLeft() {
    return dawg.ui.statusBarLeft;
  }

  get style() {
    return {
      lineHeight: `${this.height}px`,
    };
  }

  get icon() {
    return workspace.backup ? 'cloud_done' : 'cloud_off';
  }

  get openedFile() {
    return general.projectPath;
  }

  get projectName() {
    if (!this.openedFile) { return null; }
    return path.basename(this.openedFile).split('.')[0];
  }
}
</script>

<style lang="sass" scoped>
.footer
  display: flex
  width: 100%
  font-size: 12px
  height: 100%
  text-align: center
  position: unset
  padding: 0 10px
  align-items: center

.item
  margin: 0 6px
  padding-top: 1px

.status-text
  margin-left: 15px
</style>
