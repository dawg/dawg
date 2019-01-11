<template>
  <div>
    <tree
        v-for="(children, path) in projects"
        :key="path"
        :path="path"
        :children="children"
    ></tree>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { ipcRenderer } from 'electron';
import Tree from '@/components/Tree.vue';
import fs from 'fs';
import os from 'os';
import path from 'path';

interface FileTree {
  [key: string]: FileTree;
}

@Component({components: { Tree }})
export default class Drawer extends Vue {
  public drawer = true;
  public folders: string[] = [];
  get projects() {
    const tree: FileTree = {};
    this.folders.forEach((folder) => {
      tree[folder] = this.computeFileTree(folder);
    });
    return tree;
  }
  public computeFileTree(dir: string, tree: FileTree = {}) {
    fs.readdirSync(dir).map((item) => {
      const p = path.join(dir, item);
      tree[p] = {};
      if (fs.statSync(p).isDirectory()) {
        this.computeFileTree(p, tree[p]);
      }
    });
    return tree;
  }
  public addFolder(_: any, [folder]: [string]) {
    this.folders.push(folder); // Folder is always an array of length 1
  }
  public mounted() {
    try {
      this.folders = JSON.parse(localStorage.getItem('folders') || '') as string[];
    } catch (e) {
      //
    }
    ipcRenderer.on('folder', this.addFolder);
  }
  public destroyed() {
    ipcRenderer.removeListener('folder', this.addFolder);
  }

  @Watch('folders')
  public onFoldersChange() {
    localStorage.setItem('folders', JSON.stringify(this.folders));
  }
}
</script>

<style scoped>

</style>
