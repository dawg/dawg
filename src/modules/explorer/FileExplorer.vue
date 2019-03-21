<template>
  <div v-if="trees.length">
    <tree
      refs="trees"
      v-for="(project, i) in trees"
      :key="project[0]"
      :path="project[0]"
      :children="project[1]"
      :index="i"
      :bus="bus"
      @contextmenu="context"
    ></tree>
  </div>
  <div v-else class="button-wrapper">
      <p class="white--text text">You do not have any opened folders.</p>
      <v-btn 
        @click="openExplorer" 
        small 
        block
        class="primary button"
      >
        Open Folder
      </v-btn>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { ipcRenderer } from 'electron';
import fs from 'mz/fs';
import os from 'os';
import path from 'path';
import { Extensions, FileTree, EventBus } from '@/modules/explorer/types';
import { Watch, Bus } from '@/modules/update';
import { Keys } from '@/utils';

@Component
export default class FileEplorer extends Vue {
  /**
   * A list of folder paths. For example, `["/one/path", "/another/path"]
   */
  @Prop({ type: Array, required: true }) public folders!: string[];

  /**
   * The extensions. The keys represent the case-insensitive extensions (without the `.`) and the
   * values represent the drag identifier.
   */
  @Prop({ type: Object, required: true }) public extensions!: Extensions;

  public trees: Array<[string, FileTree]> = [];

  // Event bus to set up/down events
  public bus: EventBus = new Bus();

  get extensionSet() {
    return new Set(Object.keys(this.extensions).map((ext) => ext.toLowerCase()));
  }

  public async computeFileTree(dir: string): Promise<FileTree> {
    const tree: FileTree = {};

    // items = folders and files
    let items: string[];
    try {
      items = await fs.readdir(dir);
    } catch (e) {
      return {};
    }

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);
      if (stat.isFile()) {
        if (this.checkExtension(item)) {
          tree[fullPath] = fullPath;
        }
      } else {
        tree[fullPath] = await this.computeFileTree(fullPath);
      }
    }
    return tree;
  }

  public checkExtension(filePath: string) {
    const parts = filePath.split('.'); // parts.length will always >= 1
    const extension = parts[parts.length - 1];
    return this.extensionSet.has(extension);
  }

  public openExplorer() {
    this.$emit('open-explorer');
  }

  public keyup(event: KeyboardEvent) {
    if (event.keyCode !== Keys.UP) {
      return;
    }

    this.bus.$emit('up', event);
  }

  public keydown(event: KeyboardEvent) {
    if (event.keyCode !== Keys.DOWN) {
      return;
    }

    this.bus.$emit('down', event);
  }

  public mounted() {
    window.addEventListener('keydown', this.keydown);
    window.addEventListener('keyup', this.keyup);
  }

  public destroyed() {
    window.removeEventListener('keydown', this.keydown);
    window.removeEventListener('keyup', this.keyup);
  }

  @Watch<FileEplorer>('folders', { immediate: true })
  public async setTrees() {
    this.trees = [];
    this.folders.map(async (folder) => {
      this.trees.push([folder, await this.computeFileTree(folder)]);
    });
  }
}
</script>

<style scoped>
.button-wrapper {
  display: flex;
  flex-direction: column;
  padding: 10px 20px;
}

.text {
  font-size: 0.9em;
}
</style>
