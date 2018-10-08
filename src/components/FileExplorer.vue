<template>
  <div style="display: contents">
    <v-list-tile @click="showChildren = !showChildren">
      <v-list-tile-action style="min-width: 40px">
        <v-icon :style="indent">{{ isLeaf ? 'audiotrack' : 'folder' }}</v-icon>
      </v-list-tile-action>
      <v-list-tile-content>
        <v-list-tile-title :style="indent">{{ label }}</v-list-tile-title>
      </v-list-tile-content>
    </v-list-tile>
    <file-explorer
        v-if="showChildren"
        v-for="folder in folders"
        :key="folder"
        :label="folder"
        :children="children[folder]"
        :depth="depth + 1">
    </file-explorer>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

@Component
export default class FileExplorer extends Vue {
  @Prop({type: Object, required: true}) public children!: object;
  @Prop({type: String, required: true}) public label!: string;
  @Prop({type: Number, default: 0}) public depth!: number;
  public showChildren = false;

  get indent() {
    return { transform: `translate(${this.depth * 10}px)` };
  }
  get isLeaf() {
    return this.folders.length === 0;
  }
  get folders() {
    return Object.keys(this.children);
  }
}
</script>
