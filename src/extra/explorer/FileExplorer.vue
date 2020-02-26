<template>
  <div v-if="trees.length">
    <tree
      ref="trees"
      v-for="(tree, i) in trees"
      :key="tree.path"
      :path="tree.path"
      :item="tree"
      :index="i"
      :extensions="extensions"
      @contextmenu.native="context(tree.path, $event)"
    ></tree>
  </div>
  <div v-else class="flex flex-col py-5 px-6">
      <p class="text-default text-xs mb-1">You have not opened a folder.</p>
      <dg-button
        @click="openExplorer"
        type="default"
      >
        OPEN FOLDER
      </dg-button>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { Extensions, Folder, File } from '@/extra/explorer/types';
import Tree from '@/extra/explorer/Tree.vue';
import * as dawg from '@/dawg';
import { createComponent } from '@vue/composition-api';

export default createComponent({
  components: { Tree },
  name: 'FileExplorer',
  props: {
    /**
     * The extensions. The keys represent the case-insensitive extensions (without the `.`) and the
     * values represent the drag identifier.
     */
    extensions: { type: Object as () => Extensions, required: true },

    /**
     * The trees.
     */
    trees: { type: Array as () => Folder[], required: true },
  },
  setup(props, context) {
    function openExplorer() {
      context.emit('open-explorer');
    }

    function contextMenu(folder: string, event: MouseEvent) {
      dawg.context({
        position: event,
        items: [
          {
            text: 'Remove Folder From Workspace',
            callback: () => context.emit('remove', folder),
          },
        ],
      });
    }

    return {
      openExplorer,
      context: contextMenu,
    };
  },
});
</script>
