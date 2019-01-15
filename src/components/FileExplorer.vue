<template>
  <div>
    <tree
        refs="trees"
        v-for="(project, i) in projects"
        :key="project[0]"
        :path="project[0]"
        :children="project[1]"
        :index= "i"
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
    const tree: Array<[string, FileTree]> = [];
    this.folders.forEach((folder) => {
      tree.push([folder, this.computeFileTree(folder)]);
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
    if (this.folders.indexOf(folder) === -1) {
      this.folders.push(folder); // Folder is always an array of length 1
    }
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
