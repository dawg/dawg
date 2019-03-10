<template>
  <div v-if="projects.length">
    <tree
      refs="trees"
      v-for="(project, i) in projects"
      :key="project[0]"
      :path="project[0]"
      :children="project[1]"
      :index="i"
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
      const fullPath = path.join(dir, item);
      if (this.isWav(item)) {
        tree[fullPath] = {};
      }
      if (fs.statSync(fullPath).isDirectory()) {
        this.computeFileTree(fullPath, tree[fullPath]);
      }
    });
    return tree;
  }

  public isWav(fileName: string) {
    const extension = fileName.split('.').pop();
    return extension && extension.toLowerCase() === 'wav';
  }

  public openExplorer() {
    this.$emit('open-explorer');
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
