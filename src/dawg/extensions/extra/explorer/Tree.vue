<template>
  <div style="display: contents">
    <div 
      @click="$emit('select', path)"
      @mousedown="loadData"
      @dblclick="doubleClick"
      class="flex items-center hover-pointer py-1 px-2 hover:bg-default-lighten-2"
      :class="nodeClass" 
      :style="textStyle" 
    >
      <component
        v-if="isLeaf"
        :is="iconComponent"
      ></component>
      <dg-fa-icon
        class="text-default"
        v-else 
        :style="iconStyle"
        icon="caret-right"
      ></dg-fa-icon>
      
      <drag
        class="text-default ml-2 text-sm select-none truncate"
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
        v-for="(child, i) in children"
        :key="child.path"
        :path="child.path"
        :item="child"
        :extensions="extensions"
        :depth="depth + 1"
        :index="i"
        @click="$emit('select', $event)"
      ></tree>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import path from 'path';
import { Keys } from '@/utils';
import { Component, Prop } from 'vue-property-decorator';
import { Folder, File, Extensions, Extension, ExtensionData } from '@/dawg/extensions/extra/explorer/types';
import { Watch } from '@/modules/update';

@Component
export default class Tree extends Vue {
  @Prop({ type: [Object, String], required: true }) public item!: Folder | File;

  /**
   * The full path to folder or file.
   */
  @Prop({ type: String, required: true }) public path!: string;

  /**
   * See the FileExplorer.
   */
  @Prop({ type: Object, required: true }) public extensions!: Extensions;

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
    return typeof this.item === 'string';
  }

  get children() {
    if (this.item.type === 'file') {
      // The folders attribute should never be used if this is a leaf.
      // If it is, and empty list will be returned.
      return [];
    } else {
      return this.item.children;
    }
  }

  get nodeClass() {
    return this.item.isSelected.value ? 'bg-default-lighten-1' : '';
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
    const clear = (tree: Tree) => {
      if (tree !== this && tree.isSelected) {
        tree.isSelected = false;
        return;
      }

      if (tree.isLeaf) {
        return;
      }

      if (!tree.showChildren) {
        return;
      }

      console.log(tree.path, tree.$refs.trees);
      tree.$refs.trees.forEach(clear);
    };

    let root: Tree = this;
    while (root.$parent.isLeaf !== undefined) {
      root = root.$parent;
    }

    clear(root);

    this.isSelected = true;
    if (!this.isLeaf) {
      this.showChildren = !this.showChildren;
    }
  }

  public moveDown(event: KeyboardEvent) {
    if (!this.isSelected) {
      return;
    }

    setTimeout(() => {
      // FIXME Remove this setTimeout
      this.selectNext();
    }, 100);
  }

  public moveUp(event: KeyboardEvent) {
    if (!this.isSelected) {
      return;
    }

    this.selectPrevious();
  }

  public left() {
    if (!this.isSelected) {
      return;
    }

    if (this.isLeaf) {
      return;
    }

    if (this.showChildren) {
      this.showChildren = false;
    } else {
      this.$parent.isSelected = true;
      this.isSelected = false;
    }
  }

  public right() {
    if (!this.isSelected) {
      return;
    }

    if (this.isLeaf) {
      return;
    }

    if (!this.showChildren) {
      this.showChildren = true;
    }
  }

  public doubleClick(event: MouseEvent) {
    this.open(this.data);
  }

  @Watch<Tree>('isSelected')
  public async doSomeStuff(previouslySelected: boolean) {
    if (!this.isLeaf) {
      return;
    }

    if (this.data === null) {
      await this.loadData();
    }

    // TODO make sure previouslySelected works
    if (previouslySelected && this.isSelected) {
      this.stopPreview(this.data);
      this.preview(this.data);
    } else if (this.isSelected) {
      this.preview(this.data);
    } else {
      this.stopPreview(this.data);
    }
  }

  public async selectPrevious() {
    if (this.index === 0) {
      if (this.$parent.isLeaf === undefined) {
        return false;
      }

      this.$parent.isSelected = true;
      this.isSelected = false;

      return true;
    }

    const getLast = (tree: Tree): Tree => {
      if (tree.isLeaf) {
        return tree;
      }

      if (!tree.showChildren) {
        return tree;
      }

      if (tree.$refs.trees.length === 0) {
        return tree;
      }

      return getLast(tree.$refs.trees[tree.$refs.trees.length - 1]);
    };

    const sibling = this.$parent.$refs.trees[this.index - 1];
    const last = getLast(sibling);

    last.isSelected = true;
    this.isSelected = false;

    return true;
  }

  public async selectNext() {
    if (!this.isLeaf && this.showChildren) {
      const firstChild = this.$refs.trees[0];
      if (firstChild) {
        firstChild.isSelected = true;
        this.isSelected = false;
        return true;
      }
    }

    const findNext = (tree: Tree): Tree | null => {
      if (tree.index === tree.$parent.$refs.trees.length - 1) {
        if (tree.$parent.isLeaf === undefined) {
          // nowhere left to go
          return null;
        }

        return findNext(tree.$parent);
      }

      return tree.$parent.$refs.trees[tree.index + 1];
    };

    const toSelect = findNext(this);
    if (!toSelect) {
      return false;
    }

    if (toSelect) {
      toSelect.isSelected = true;
      this.isSelected = false;
    }

    return true;



    const sibling = this.$parent.$refs.trees[this.index + 1];
    sibling.isSelected = true;
    this.isSelected = false;

    return true;
  }

  public async loadData() {
    if (this.data) {
      return;
    }

    // always await
    this.data = await this.load(this.path);
    this.transferData = this.createTransferData(this.data);
  }
}
</script>
