<template>
  <v-navigation-drawer fixed clipped permanent app>
    <v-list dense>
      <file-explorer
          v-for="(children, label) in projects"
          :key="label"
          :label="label"
          :children="children"
      ></file-explorer>
    </v-list>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { ipcRenderer } from 'electron';
import FileExplorer from '@/components/FileExplorer.vue';
import fs from 'fs';
import path from 'path';

interface Tree {
  [key: string]: Tree;
}

@Component({components: {FileExplorer}})
export default class Drawer extends Vue {
  public drawer = true;
  public folders = ['/home/jacob/Downloads'];
  get projects() {
    const tree: Tree = {};
    return this.folders.forEach((folder) => {
      tree[path.basename(folder)] = this.computeTree(folder);
    });
  }
  public computeTree(dir: string, tree: Tree = {}) {
    fs.readdirSync(dir).map((item) => {
      tree[item] = {};
      const p = path.join(dir, item);
      if (fs.statSync(p).isDirectory()) {
        this.computeTree(p, tree[item]);
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
