<template>
  <v-navigation-drawer fixed clipped permanent app>
    <v-list dense>
      <tree
          v-for="(children, label) in projects"
          :key="label"
          :label="label"
          :children="children"
      ></tree>
    </v-list>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { ipcRenderer } from 'electron';
import Tree from '@/components/Tree.vue';
import fs from 'fs';
import os from 'os';
import path from 'path';

interface FileTree {
  [key: string]: FileTree;
}

@Component({components: {Tree}})
export default class Drawer extends Vue {
  public drawer = true;
  public folders = [path.join(os.homedir(), 'Downloads')];
  get projects() {
    const tree: FileTree = {};
    return this.folders.forEach((folder) => {
      tree[path.basename(folder)] = this.computeFileTree(folder);
    });
  }
  public computeFileTree(dir: string, tree: FileTree = {}) {
    fs.readdirSync(dir).map((item) => {
      tree[item] = {};
      const p = path.join(dir, item);
      if (fs.statSync(p).isDirectory()) {
        this.computeFileTree(p, tree[item]);
      }
    });
    return tree;
  }
  public addFolder(_: any, [folder]: [string]) {
    this.folders.push(folder); // Folder is always an array of length 1
  }
  public mounted() {
    ipcRenderer.on('folder', this.addFolder);
  }
  public destroyed() {
    ipcRenderer.removeListener('folder', this.addFolder);
  }
}
</script>

<style scoped>

</style>
