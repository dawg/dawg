<template>
  <div style="display: contents">
    <div 
      @click="click" 
      @mousedown="loadData"
      @dblclick="doubleClick"
      style="display: flex" 
      :class="nodeClass" 
      :style="textStyle" 
    >
      <component
        v-if="isLeaf"
        :is="iconComponent"
      ></component>
      <dg-icon
        v-else 
        fa 
        class="icon" 
        :style="iconStyle"
      >
        caret-right
      </dg-icon>
      
      <drag
        class="white--text path"
        :group="dragGroup"
        :transfer-data="transferData"
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
        :extensions="extensions"
        :bus="bus"
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
import { FileTree, EventBus, Extensions, Extension, ExtensionData } from '@/dawg/extensions/extra/explorer/types';
import { Watch } from '@/modules/update';

@Component
export default class Tree extends Vue {
  @Prop({ type: [Object, String], required: true }) public tree!: FileTree | string;

  /**
   * The full path to folder or file.
   */
  @Prop({ type: String, required: true }) public path!: string;

  /**
   * See the FileExplorer.
   */
  @Prop({ type: Object, required: true }) public extensions!: Extensions;

  /**
   * The event bus to communicate with the root.
   */
  @Prop({ type: Object, required: true }) public bus!: EventBus;

  /**
   * The depth. You don't need to set this as it will be set automatically.
   */
  @Prop({ type: Number, default: 0 }) public depth!: number;

  /**
   * The index of the tree.
   */
  @Prop({ type: Number, required: true }) public index!: number;

  // public sample: Sample | null = null;
  public showChildren = false;
  public isSelected = false;

  public $refs!: {
    trees: Tree[],
  };

  // Event though the root Trees won't have Trees as parents, they will have the FileExplorer as a parent
  // The ref on FileExplorer is also called trees
  public $parent!: Tree;

  public data: object | null = null;
  public transferData: any = null;

  get draggable() {
    return !!this.transferData;
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
    return this.isSelected ? 'selected-node' : 'node';
  }

  get fileName() {
    return path.basename(this.path);
  }

  get extension(): Extension | null {
    if (this.isLeaf) {
      const parts = this.path.split('.');

      // This is ok because we filter
      return parts[parts.length - 1] as Extension;
    } else {
      return null;
    }
  }

  get extensionData(): ExtensionData<any, any> {
    if (!this.extension) {
      return {
        dragGroup: '',
        iconComponent: '',
        load: () => ({}),
        createTransferData: () => ({}),
        preview: () => ({}),
        stopPreview: () => ({}),
      };
    }

    return this.extensions[this.extension];
  }

  get dragGroup() {
    return this.extensionData.dragGroup;
  }

  get iconComponent() {
    return this.extensionData.iconComponent;
  }

  get preview() {
    if (this.extensionData.preview) {
      return this.extensionData.preview;
    }

    return () => {
      // nothing by default
    };
  }

  get open() {
    if (this.extensionData.open) {
      return this.extensionData.open;
    }

    return () => {
      // nothing by default
    };
  }

  get stopPreview() {
    if (this.extensionData.stopPreview) {
      return this.extensionData.stopPreview;
    }

    return () => {
      // nothing by default
    };
  }

  get load() {
    return this.extensionData.load;
  }

  get createTransferData() {
    if (this.extensionData.createTransferData) {
      return this.extensionData.createTransferData;
    }

    return (data: any) => data;
  }


  public click() {
    if (this.isLeaf) {
      this.select(this.index);
    } else {
      this.showChildren = !this.showChildren;
    }
  }

  public moveDown(event: KeyboardEvent) {
    if (!this.isSelected) {
      return;
    }

    setTimeout(() => {
      // FIXME Remove this setTimeout
      this.select(this.index + 1);
    }, 100);
  }

  public moveUp(event: KeyboardEvent) {
    if (!this.isSelected) {
      return;
    }

    this.select(this.index - 1);
  }

  public doubleClick(event: MouseEvent) {
    this.open(this.data);
  }

  public async select(index: number) {
    const trees = this.$parent.$refs.trees;
    if (index < 0 || index >= trees.length) {
      return;
    }

    if (!trees[index].isLeaf) {
      return;
    }

    trees.forEach(async (tree, i) => {
      if (i === index) {
        if (trees[i].data === null) {
          await trees[i].loadData();
        }

        // If it's already selected, stop and start the preview
        if (tree.isSelected) {
          this.startAndStop();
        }

        tree.isSelected = true;
      } else {
        tree.isSelected = false;
      }
    });
  }

  public async loadData() {
    if (this.data) {
      return;
    }

    // always await
    this.data = await this.load(this.path);
    this.transferData = this.createTransferData(this.data);
  }

  public mounted() {
    this.bus.$on('up', this.moveUp);
    this.bus.$on('down', this.moveDown);
  }

  public destroyed() {
    this.bus.$off('up', this.moveUp);
    this.bus.$off('down', this.moveDown);
  }

  public startAndStop() {
    this.stopPreview(this.data);
    this.preview(this.data);
  }

  @Watch<Tree>('isSelected')
  public startOrStop() {
    if (this.isSelected) {
      this.preview(this.data);
    } else {
      this.stopPreview(this.data);
    }
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
