<template>
  <div style="display: contents">
    <div @click="click" style="display: flex" class="node">
      <ico 
        fa 
        class="icon"
        :scale="scale" 
        :style="indent"
      >
        {{ icon }}
      </ico>
      <div class="white--text label">{{ label }}</div>
    </div>
    <tree
        v-if="showChildren"
        v-for="folder in folders"
        :key="folder"
        :label="folder"
        :children="children[folder]"
        :depth="depth + 1">
    </tree>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

@Component
export default class Tree extends Vue {
  @Prop({type: Object, required: true}) public children!: object;
  @Prop({type: String, required: true}) public label!: string;
  @Prop({type: Number, default: 0}) public depth!: number;
  public showChildren = false;
  public click() {
    if (!this.isLeaf) {
      this.showChildren = !this.showChildren;
    }
  }
  get indent() {
    let rotate = 0;
    if (this.showChildren) {
      rotate = 45;
    }

    return {
      marginLeft: `${this.depth * 10}px`,
      transform: `rotate(${rotate}deg)`,
    };
  }
  get isLeaf() {
    return this.folders.length === 0;
  }
  get folders() {
    return Object.keys(this.children);
  }
  get icon() {
    return this.isLeaf ? 'file' : 'caret-right';
  }
  get scale() {
    return this.isLeaf ? 0.8 : 1;
  }
}
</script>

<style lang="sass" scoped>
.label
  margin-left: 8px

.node:hover
  background: rgba(255,255,255,0.12)
  cursor: pointer

.node
  font-size: 15px
  padding: 4px 8px
</style>
