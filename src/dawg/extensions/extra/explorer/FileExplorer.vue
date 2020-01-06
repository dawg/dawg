<template>
  <div v-if="trees.length">
    <tree
      ref="trees"
      v-for="(items, i) in trees"
      :key="items[0]"
      :path="items[0]"
      :item="items[1]"
      :index="i"
      :extensions="extensions"
      @contextmenu.native="context(items[0], $event)"
      @select="select(items[0], items[1], $event)"
    ></tree>
  </div>
  <div v-else class="flex flex-col py-5 px-6">
      <p class="text-default text-xs mb-1">You have not opened a folder.</p>
      <dg-button
        @click="openExplorer"
        type="primary"
      >
        OPEN FOLDER
      </dg-button>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { ipcRenderer } from 'electron';
import fs, { FSWatcher } from '@/fs';
import os from 'os';
import path from 'path';
import { Extensions, Folder, File } from '@/dawg/extensions/extra/explorer/types';
import { Watch, Bus } from '@/modules/update';
import { Keys } from '@/utils';
import Tree from '@/dawg/extensions/extra/explorer/Tree.vue';
import * as dawg from '@/dawg';
import { ref } from '@vue/composition-api';

@Component({
  components: { Tree },
})
export default class FileEplorer extends Vue {
  /**
   * A list of folder paths. For example, `["/one/path", "/another/path"]
   */
  @Prop({ type: Array, required: true }) public folders!: string[];

  /**
   * The extensions. The keys represent the case-insensitive extensions (without the `.`) and the
   * values represent the drag identifier.
   */
  @Prop({ type: Object, required: true }) public extensions!: Extensions;

  public trees: Array<[string, Folder]> = [];
  public watchers: FSWatcher[] = [];
  public currentSelection: File | Folder | null = null;

  get extensionSet() {
    return new Set(Object.keys(this.extensions).map((ext) => ext.toLowerCase()));
  }

  public async computeFileTree(dir: string, parent: Folder | null): Promise<Folder> {
    const tree: Folder = {
      type: 'folder',
      parent: null,
      path: dir,
      isExpanded: ref(false),
      isSelected: ref(false),
      children: {},
    };

    // items = folders and files
    let items: string[];
    try {
      items = await fs.readdir(dir);
    } catch (e) {
      // UHH TODO should we do this?
      return tree;
    }

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);
      if (stat.isFile()) {
        if (this.checkExtension(item)) {
          tree.children[fullPath] = {
            type: 'file',
            parent,
            path: fullPath,
            isExpanded: ref(false),
            isSelected: ref(false),
            value: fullPath,
          };
        }
      } else {
        tree.children[fullPath] = await this.computeFileTree(fullPath, tree);
      }
    }
    return tree;
  }

  public checkExtension(filePath: string) {
    const parts = filePath.split('.'); // parts.length will always >= 1
    const extension = parts[parts.length - 1];
    return this.extensionSet.has(extension);
  }

  public openExplorer() {
    this.$emit('open-explorer');
  }

  public select(startPath: string, folder: Folder, fullPath: string) {
    const startParts = startPath.split(path.sep);
    const fullParts = fullPath.split(path.sep);
    const endParts = fullParts.slice(startParts.length);

    let currentPath = startPath;
    let item: Folder | File = folder;
    for (const part of endParts) {
      if (part) {
        currentPath = path.join(currentPath, part);
      }

      if (item.type === 'file') {
        // I don't think we will ever hit this
        break;
      }

      item = item.children[currentPath];
    }

    if (this.currentSelection) {
      this.currentSelection.isSelected.value = false;
    }

    item.isSelected.value = true;
  }

  public keydown(event: KeyboardEvent) {
    if (event.keyCode === Keys.DOWN) {
      // this.bus.$emit('down', event);
    }

    if (event.keyCode === Keys.RIGHT) {
      // this.bus.$emit('right', event);
    }


    if (event.keyCode === Keys.LEFT) {
      // this.bus.$emit('left', event);
    }

    if (event.keyCode === Keys.UP) {
      // this.bus.$emit('up', event);
    }
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

  public mounted() {
    window.addEventListener('keydown', this.keydown);
  }

  public destroyed() {
    window.removeEventListener('keydown', this.keydown);
  }

  @Watch<FileEplorer>('folders', { immediate: true })
  public async setTrees() {
    this.trees = [];

    this.watchers.forEach((watcher) => {
      watcher.close();
    });

    this.watchers = [];
    this.folders.forEach(async (folder) => {
      this.watchers.push(fs.watch(folder, () => {
        // Recompute the whole tree structure if something changed
        this.setTrees();
      }));

      this.trees.push([folder, await this.computeFileTree(folder, null)]);
    });
  }
}
</script>
