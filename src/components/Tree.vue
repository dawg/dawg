<template>
  <div style="display: contents">
    <div @click="click" style="display: flex" v-bind:class="nodeClass" v-if="!isLeaf || isWav">
      <ico fa class="icon" :scale="scale" :style="indent">{{ icon }}</ico>
      <div
        class="white--text path"
        v-if="!isLeaf || isWav"
        @click="preview"
        @dblclick="sendToSampleTab"
      >
        {{ fileName }}
      </div>
    </div>
    <tree
      ref="trees"
      v-if="showChildren"
      v-for="(folder, i) in folders"
      :key="folder"
      :path="folder"
      :children="children[folder]"
      :depth="depth + 1"
      :index="i"
    ></tree>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Tone from 'tone';
import path from 'path';
import fs from 'fs';
import av from 'av';
import { Keys } from '@/keys';
import { Component, Prop } from 'vue-property-decorator';
import Key from '@/components/Key.vue';
import { forEach } from 'typescript-collections/dist/lib/arrays';

@Component
export default class Tree extends Vue {
  @Prop({ type: Object, required: true }) public children!: object;
  @Prop({ type: String, required: true }) public path!: string;
  @Prop({ type: Number, default: 0 }) public depth!: number;
  @Prop({ type: Number, default: 0 }) public index!: number;

  public showChildren = false;
  public selectedNode = false;
  public $refs!: { trees: Tree[] };
  public $parent!: Tree;

  public click() {
    if (!this.isLeaf) {
      this.showChildren = !this.showChildren;
    }
  }

  public async moveDown(event: KeyboardEvent) {
    if (event.keyCode === Keys.DOWN && this.selectedNode) {
        if (this.index + 1 < this.$parent.$refs.trees.length) {
           console.log(this.index, this.$parent.$refs.trees);
           this.selectOneNode(this.$parent.$refs.trees, this.index + 1);
        }
    }
  }

  public async moveUp(event: KeyboardEvent) {
      if (event.keyCode === Keys.UP && this.selectedNode) {
        if (this.index - 1 >= 0) {
          console.log(this.index, this.$parent.$refs.trees);
          this.selectOneNode(this.$parent.$refs.trees, this.index - 1);
        }
      }
  }
  public async sendToSampleTab(event: MouseEvent) {
    this.selectedNode = true;
    // TODO: From here we can send this.path to sample viewer
  }

  public async preview(event: MouseEvent) {
    if (this.isWav) {
      this.selectOneNode(this.$parent.$refs.trees, this.index);
      const player = new Tone.Player(this.fileName).toMaster();
      player.autostart = true;
    }
  }

  public selectOneNode(trees: Tree[], index: number) {
    for (let i = 0; i < trees.length; i++) {
      if (i === index) {
        trees[i].selectedNode = true;
      } else {
        trees[i].selectedNode = false;
      }
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
  get nodeClass() {
    return this.selectedNode ? 'selected-node' : 'node';
  }
  get fileName() {
    return path.basename(this.path);
  }
  get icon() {
    return this.isLeaf ? 'file' : 'caret-right';
  }
  get scale() {
    return this.isLeaf ? 0.8 : 1;
  }
  get isWav() {
    const extension = this.path.split('.').pop();
    if (extension) {
      return extension.toLowerCase() === 'wav';
    }
    return false;
  }

  public mounted() {
    window.addEventListener('keydown', this.moveDown);
    window.addEventListener('keyup', this.moveUp);
  }

  public destroyed() {
    window.removeEventListener('keydown', this.moveDown);
    window.removeEventListener('keyup', this.moveUp);
  }
}
</script>

<style lang="sass" scoped>
.path
  margin-left: 8px
  user-select: none

.node:hover
  background: rgba(255,255,255,0.12)
  cursor: pointer

.node
  font-size: 15px
  padding: 4px 8px

.selected-node
  font-size: 15px
  padding: 4px 8px
  background: rgba(255,255,255,0.12)

</style>
