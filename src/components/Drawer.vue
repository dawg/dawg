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

<script>
// eslint-disable-next-line import/no-extraneous-dependencies
import { ipcRenderer } from 'electron';
import FileExplorer from '@/components/FileExplorer.vue';

const fs = require('fs');
const path = require('path');

export default {
  name: 'Drawer',
  components: { FileExplorer },
  data() {
    return {
      drawer: true,
      folders: ['/home/jacob/Downloads'],
    };
  },
  computed: {
    projects() {
      return this.folders.reduce((tree, folder) => {
        // eslint-disable-next-line no-param-reassign
        tree[path.basename(folder)] = this.computeTree(folder); return tree;
      }, {});
    },
  },
  methods: {
    computeTree(dir, tree = {}) {
      // eslint-disable-next-line array-callback-return
      fs.readdirSync(dir).map((item) => {
        // eslint-disable-next-line no-param-reassign
        tree[item] = {};
        const p = path.join(dir, item);
        if (fs.statSync(p).isDirectory()) {
          this.computeTree(p, tree[item]);
        }
      });
      return tree;
    },
    addFolder(_, folder) {
      this.folders.push(folder[0]); // Folder is always an array of length 1
    },
  },
  mounted() {
    ipcRenderer.on('folder', this.addFolder);
  },
  destroyed() {
    ipcRenderer.removeListener('folder', this.addFolder);
  },
};
</script>

<style scoped>

</style>
