<template>
  <div style="display: contents">
    <div 
      v-if="!isLeaf || isWav"
      @click="click" 
      style="display: flex" 
      :class="nodeClass" 
      :style="textStyle" 
    >
      <wav-icon v-if="isLeaf"></wav-icon>
      <ico v-else fa class="icon" :style="iconStyle">
        caret-right
      </ico>
      <drag
        class="white--text path"
        group="arranger"
        :transfer-data="prototype"
        v-if="!isLeaf || isWav"
        @mousedown.native="loadPrototype"
        @click.native="preview"
        @dblclick.native="doubleClick"
        :draggable="draggable"
      >
        {{ fileName }}
      </drag>
    </div>
    <div v-if="showChildren">
      <tree
        ref="trees"
        v-for="(folder, i) in folders"
        :key="folder"
        :path="folder"
        :tree="tree[folder]"
        :depth="depth + 1"
        :index="i"
      ></tree>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Tone from 'tone';
import path from 'path';
import { Keys } from '@/utils';
import { Component, Prop } from 'vue-property-decorator';
import Key from '@/components/Key.vue';
import { loadBuffer } from '@/modules/wav/local';
import { PlacedSample, Sample } from '@/schemas';
import { FileTree, EventBus } from '@/modules/explorer/types';

@Component
export default class Tree extends Vue {
  @Prop({ type: Object, required: true }) public tree!: FileTree | string;
  @Prop({ type: String, required: true }) public path!: string;

  /**
   * The event bus to communicate with the root.
   */
  @Prop({ type: Object, required: true }) public bus!: EventBus;

  /**
   * The depth. You don't need to set this.
   */
  @Prop({ type: Number, default: 0 }) public depth!: number;
  @Prop({ type: Number, default: 0 }) public index!: number;

  public sample: Sample | null = null;
  public showChildren = false;
  public selectedNode = false;
  public $refs!: { trees: Tree[] };
  public $parent!: Tree;
  public prototype: null | PlacedSample = null;

  get draggable() {
    return this.isWav && !!this.prototype;
  }

  get marginLeft() {
    return `${this.depth * 10 + 4}px`;
  }

  get iconStyle() {
    return {
      marginLeft: this.marginLeft,
      transform: `rotate(${this.showChildren ? 45 : 0}deg)`,
    };
  }

  get textStyle() {
    return {
      paddingLeft: this.marginLeft,
    };
  }

  get isLeaf() {
    return typeof this.tree === 'string';
  }

  get folders() {
    if (this.isLeaf) {
      // The folders attribute should never be used if this is a leaf.
      // If it is, and empty list will be returned.
      return [];
    } else {
      return Object.keys(this.tree);
    }
  }

  get nodeClass() {
    return this.selectedNode ? 'selected-node' : 'node';
  }

  get fileName() {
    return path.basename(this.path);
  }

  get icon() {
    return this.isLeaf ? 'music' : 'caret-right';
  }

  get isWav() {
    const extension = this.path.split('.').pop();
    if (extension) {
      return extension.toLowerCase() === 'wav';
    }
    return false;
  }

  public click() {
    if (!this.isLeaf) {
      this.showChildren = !this.showChildren;
    }
  }

  public moveDown(event: KeyboardEvent) {
    if (!this.selectedNode) {
      return;
    }

    event.stopImmediatePropagation();
    if (this.index + 1 < this.$parent.$refs.trees.length) {
      if (this.$parent.$refs.trees[this.index + 1].isWav) {
        this.selectOneNode(this.$parent.$refs.trees, this.index + 1);
        this.stopSong();
        this.playSong(this.$parent.$refs.trees[this.index + 1].path);
      }
    }
  }

  public moveUp(event: KeyboardEvent) {
    if (!this.selectedNode) {
      return;
    }

    if (this.index - 1 >= 0) {
      if (this.$parent.$refs.trees[this.index - 1].isWav) {
        this.selectOneNode(this.$parent.$refs.trees, this.index - 1);
        this.stopSong();
        this.playSong(this.$parent.$refs.trees[this.index - 1].path);
      }
    }
  }

  public doubleClick(event: MouseEvent) {
    this.bus.$emit('dblclick', event);
  }

  public preview(event: MouseEvent) {
    if (this.isWav) {
      this.selectOneNode(this.$parent.$refs.trees, this.index);
      this.playSong(this.path);
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

  public playSong(songPath: string) {
    if (this.sample) {
      this.sample.preview();
    }
  }

  public loadPrototype() {
    if (!this.sample && this.isWav) {
      this.sample = Sample.create(this.path, loadBuffer(this.path));
      this.prototype = PlacedSample.create(this.sample);
    }
  }

  public stopSong() {
    if (this.sample) {
      this.sample.stopPreview();
    }
  }

  public mounted() {
    this.bus.$on('up', this.moveUp);
    this.bus.$on('down', this.moveDown);
  }

  public destroyed() {
    this.bus.$off('up', this.moveUp);
    this.bus.$off('down', this.moveDown);
  }
}
</script>

<style lang="sass" scoped>
.path
  margin-left: 8px
  font-size: 0.85em
  user-select: none
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis

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

.selected-node:hover
  cursor: pointer

.icon
  padding: 2px
</style>
