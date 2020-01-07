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
        type="default"
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
import { Extensions, Folder, File, Folders } from '@/dawg/extensions/extra/explorer/types';
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
  @Prop({ type: Array, required: true }) public folders!: Folders;

  /**
   * The extensions. The keys represent the case-insensitive extensions (without the `.`) and the
   * values represent the drag identifier.
   */
  @Prop({ type: Object, required: true }) public extensions!: Extensions;

  /**
   * The selected folder. Just for syncing.
   */
  @Prop(String) public selected?: string;

  /**
   * The trees. Do not set, just for syncing purposes.
   */
  public trees: Array<[string, Folder]> = [];

  public watchers: FSWatcher[] = [];
  public currentSelection: File | Folder | null = null;

  get extensionSet() {
    return new Set(Object.keys(this.extensions).map((ext) => ext.toLowerCase()));
  }

  public async computeFileTree(dir: string, parent: Folder | null, index: number): Promise<Folder> {
    const tree: Folder = {
      type: 'folder',
      parent,
      index,
      path: dir,
      isExpanded: ref(false),
      isSelected: ref(false),
      children: [],
    };

    // items = folders and files
    let items: string[];
    try {
      items = await fs.readdir(dir);
    } catch (e) {
      // UHH TODO should we do this?
      return tree;
    }

    let i = 0;
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);
      if (stat.isFile()) {
        if (this.checkExtension(item)) {
          tree.children.push({
            type: 'file',
            parent: tree,
            index: i,
            path: fullPath,
            isSelected: ref(false),
            value: fullPath,
          });
          i++;
        }
      } else {
        tree.children.push(await this.computeFileTree(fullPath, tree, i));
        i++;
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

      const newItem: File | Folder | undefined = item.children.find((child) => child.path === currentPath);
      if (!newItem) {
        return;
      }

      item = newItem;
    }

    if (item.type === 'folder') {
      item.isExpanded.value = !item.isExpanded.value;
    }

    if (this.currentSelection) {
      this.currentSelection.isSelected.value = false;
    }

    // We are using a watcher to stop/start the preview
    // If the user clicks on the same item then we first set selected from true -> false -> true
    // When Vue checks for changes, it doesn't detect anything
    // So we set to false, wait for the next tick then set to true to make sure the watcher function calls
    this.$nextTick(() => {
      item.isSelected.value = true;
      this.currentSelection = item;
    });
  }

  public keydown(event: KeyboardEvent) {
    const item = this.currentSelection;
    if (!item) {
      return;
    }

    if (event.keyCode === Keys.DOWN) {
      if (item.type === 'folder' && item.isExpanded.value) {
        const firstChild = item.children[0];
        if (firstChild) {
          this.currentSelection = firstChild;
          firstChild.isSelected.value = true;
          item.isSelected.value = false;
          return;
        }
      }

      const findNext = (tree: File | Folder): File | Folder | null => {
        if (tree.parent === null) {
          // nowhere left to go
          return null;
        }

        if (tree.index === tree.parent.children.length - 1) {
          return findNext(tree.parent);
        }

        return tree.parent.children[tree.index + 1];
      };

      const toSelect = findNext(item);
      if (!toSelect) {
        return;
      }

      if (toSelect) {
        this.currentSelection = toSelect;
        toSelect.isSelected.value = true;
        item.isSelected.value = false;
      }
    }

    if (event.keyCode === Keys.UP) {
      if (item.index === 0) {
        if (item.parent === null) {
          return;
        }

        item.parent.isSelected.value = true;
        item.isSelected.value = false;
        this.currentSelection = item.parent;
        return;
      }

      const getLast = (tree: File | Folder): File | Folder => {
        if (tree.type === 'file') {
          return tree;
        }

        if (!tree.isExpanded.value) {
          return tree;
        }

        if (tree.children.length === 0) {
          return tree;
        }

        return getLast(tree.children[tree.children.length - 1]);
      };

      if (item.parent === null) {
        // This condition should never be true
        return;
      }

      const sibling = item.parent.children[item.index - 1];
      const last = getLast(sibling);

      last.isSelected.value = true;
      item.isSelected.value = false;
      this.currentSelection = last;
    }

    if (item.type === 'file') {
      return;
    }

    if (event.keyCode === Keys.RIGHT) {
      if (!item.isExpanded.value) {
        item.isExpanded.value = true;
      }
    }

    if (event.keyCode === Keys.LEFT) {
      if (item.isExpanded.value) {
        item.isExpanded.value = false;
      } else {
        if (item.parent !== null) {
          item.isSelected.value = false;
          item.parent.isSelected.value = true;
          this.currentSelection = item.parent;
        }
      }
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

  @Watch<FileEplorer>('currentSelection', { immediate: true })
  public updateSelected() {
    if (this.currentSelection) {
      this.$update('selected', this.currentSelection.path);
    }
  }


  @Watch<FileEplorer>('folders', { immediate: true })
  public async setTrees() {
    this.trees = [];

    this.watchers.forEach((watcher) => {
      watcher.close();
    });

    this.watchers = [];
    this.folders.forEach(async (folderInfo) => {
      // FIXME We are recomputing everything when the folder/file changes
      // We would want to be more specific in our re-rendering
      // We will also want to serialize the isExpanded information and the isSelected information
      this.watchers.push(fs.watch(folderInfo.folder, () => {
        // Recompute the whole tree structure if something changed
        this.setTrees();
      }));

      const tree = await this.computeFileTree(folderInfo.folder, null, 0);
      const openFolders = new Set(folderInfo.openFolders);

      const recurse = (folder: Folder) => {
        if (openFolders.has(folder.path)) {
          folder.isExpanded.value = true;
        }

        if (this.selected === folder.path) {
          folder.isSelected.value = true;
        }

        folder.children.forEach((child) => {
          if (child.type === 'file') {
            return;
          }

          recurse(child);
        });
      };

      recurse(tree);

      this.trees.push([folderInfo.folder, tree]);
    });

    this.$emit('update-trees', this.trees);
  }
}
</script>
