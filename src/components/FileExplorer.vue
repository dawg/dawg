<template>
  <div style="display: contents">
    <v-list-tile @click="showChildren = !showChildren">
      <v-list-tile-action style="min-width: 40px">
        <v-icon :style="indent">{{ isLeaf ? 'audiotrack' : 'folder' }}</v-icon>
      </v-list-tile-action>
      <v-list-tile-content>
        <v-list-tile-title :style="indent">{{ label }}</v-list-tile-title>
      </v-list-tile-content>
    </v-list-tile>
    <file-explorer
        v-if="showChildren"
        v-for="folder in folders"
        :key="folder"
        :label="folder"
        :children="children[folder]"
        :depth="depth + 1">
    </file-explorer>
  </div>
</template>

<script>
export default {
  name: 'FileExplorer',
  props: {
    children: { type: Object, required: true },
    label: { type: String, required: true },
    depth: { type: Number, default: 0 },
  },
  data() {
    return { showChildren: false };
  },
  computed: {
    indent() {
      return { transform: `translate(${this.depth * 10}px)` };
    },
    isLeaf() {
      return this.folders.length === 0;
    },
    folders() {
      return Object.keys(this.children);
    },
  },
};
</script>
