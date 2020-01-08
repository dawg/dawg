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
import { Extensions, Folder, File } from '@/dawg/extensions/extra/explorer/types';
import Tree from '@/dawg/extensions/extra/explorer/Tree.vue';
import * as dawg from '@/dawg';

@Component({
  components: { Tree },
})
export default class FileEplorer extends Vue {
  /**
   * The extensions. The keys represent the case-insensitive extensions (without the `.`) and the
   * values represent the drag identifier.
   */
  @Prop({ type: Object, required: true }) public extensions!: Extensions;

  /**
   * The trees.
   */
  @Prop({ type: Array, required: true }) public trees!: Folder[];

  public openExplorer() {
    this.$emit('open-explorer');
  }

  public context(folder: string, event: MouseEvent) {
    dawg.context({
      position: event,
      items: [
        {
          text: 'Remove Folder From Workspace',
          callback: () => this.$emit('remove', folder),
        },
      ],
    });
  }
}
</script>
