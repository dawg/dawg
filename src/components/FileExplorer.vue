<template>
  <div>
    <tree
      refs="trees"
      v-for="(project, i) in projects"
      :key="project[0]"
      :path="project[0]"
      :children="project[1]"
      :index="i"
    ></tree>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch, Prop } from 'vue-property-decorator';
import { ipcRenderer } from 'electron';
import Tree from '@/components/Tree.vue';
import fs from 'fs';
import os from 'os';
import path from 'path';

interface FileTree {
  [key: string]: FileTree;
}

@Component({ components: { Tree } })
export default class Drawer extends Vue {
  @Prop({ type: Array, required: true }) public folders!: string[];

  public drawer = true;

  get projects() {
    const tree: Array<[string, FileTree]> = [];
    this.folders.forEach((folder) => {
      tree.push([folder, this.computeFileTree(folder)]);
    });
    return tree;
  }

  public computeFileTree(dir: string, tree: FileTree = {}) {
    fs.readdirSync(dir).map((item) => {
      const p = path.join(dir, item);
      if (this.isEligibleFile(item)) {
        tree[p] = {};
      }
      if (fs.statSync(p).isDirectory()) {
        this.computeFileTree(p, tree[p]);
      }
    });
    return tree;
  }

  public addFolder(_: any, [folder]: [string]) {
    if (this.folders.indexOf(folder) === -1) {
      this.$update('folders', [...this.folders, folder]);
    }
  }

  public mounted() {
    ipcRenderer.on('folder', this.addFolder);
  }

  public destroyed() {
    ipcRenderer.removeListener('folder', this.addFolder);
  }

  public isEligibleFile(fileName: string) {
    const extension = fileName.split('.').pop();
    if (extension) {
      return extension.toLowerCase() === 'wav';
    }

    return false;
  }
}
</script>

<style scoped>
</style>
