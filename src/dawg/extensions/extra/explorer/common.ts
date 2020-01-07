import { Folder, File } from '@/dawg/extensions/extra/explorer/types';
import { ref, Ref } from '@vue/composition-api';
import path from 'path';
import fs, { FSWatcher } from '@/fs';
import { Keys } from '@/utils';

// Beware, naming is a bit weird. Hopefully types help you understand what things are.

export interface Memento {
  selected?: {
    rootFolder: string;
    selectedPath: string;
  };
  folders: Array<{ rootFolder: string, openedFolders: string[] }>;
}

export const createFileExplorer = async (extensions: Set<string>) => {
  const selected = ref<File | Folder>(null);
  const trees: Ref<Folder[]> = ref([]);
  let watchers: FSWatcher[] = [];
  const listener = (e: KeyboardEvent) => keydown(e, selected);
  window.addEventListener('keydown', listener);

  const select = (item: Folder | File) => {
    if (item.type === 'folder') {
      item.isExpanded.value = !item.isExpanded.value;
    }

    if (selected.value) {
      selected.value.isSelected.value = false;
    }

    item.isSelected.value = true;
    selected.value = item;
  };

  const createMemento = (): Memento => {
    // tslint:disable-next-line:variable-name
    let _selected: { selectedPath: string, rootFolder: string } | undefined;
    if (selected.value) {
      let root = selected.value;
      while (root.parent) { root = root.parent; }
      _selected = {
        selectedPath: selected.value.path,
        rootFolder: root.path,
      };
    }

    const folders = trees.value.map((tree) => {
      const folderInfo = { rootFolder: tree.path, openedFolders: [] as string[] };

      const recurse = (folder: Folder) => {
        if (folder.isExpanded.value) {
          folderInfo.openedFolders.push(folder.path);
        }

        folder.children.forEach((child) => {
          if (child.type === 'file') {
            return;
          }

          recurse(child);
        });
      };

      recurse(tree);

      return folderInfo;
    });

    return {
      folders,
      selected: _selected,
    };
  };

  const setMemento = (memento: Memento) => {
    // const rootFolder = createFileExplorerHelper({ dir, parent: null, index: 0, extensions });
    trees.value = [];
    selected.value = null;

    watchers.forEach((watcher) => {
      watcher.close();
    });

    watchers = [];

    memento.folders.forEach(async (folderInfo) => {
      // FIXME We are recomputing everything when the folder/file changes
      // We would want to be more specific in our re-rendering
      // We will also want to serialize the isExpanded information and the isSelected information
      watchers.push(fs.watch(folderInfo.rootFolder, () => {
        // Recompute the whole tree structure if something changed
        setMemento(createMemento());
      }));

      const tree = await createFileExplorerHelper({
        dir: folderInfo.rootFolder,
        parent: null,
        index: 0,
        extensions,
        select,
      });
      const openFolders = new Set(folderInfo.openedFolders);

      const recurse = (item: Folder | File) => {
        if (
          memento.selected &&
          memento.selected.rootFolder === tree.path &&
          memento.selected.selectedPath === item.path
        ) {
          selected.value = item;
          item.isSelected.value = true;
        }

        if (item.type === 'file') {
          return;
        }

        if (openFolders.has(item.path)) {
          item.isExpanded.value = true;
        }

        item.children.forEach(recurse);
      };

      recurse(tree);
      trees.value.push(tree);
    });
  };

  return {
    trees,
    createMemento,
    setMemento,
    addFolder: (rootFolder: string) => {
      const memento = createMemento();
      // Check if the folder already exists
      if (memento.folders.find((f) => f.rootFolder === rootFolder)) {
        return;
      }

      memento.folders.push({ rootFolder, openedFolders: [] });

      setMemento(memento);
    },
    dispose: () => {
      window.removeEventListener('keydown', listener);
      watchers.forEach((watcher) => watcher.close());
      watchers = [];
      trees.value = [];
    },
  } as const;
};

const keydown = (event: KeyboardEvent, current: Ref<File | Folder | null>) => {
  const item = current.value;
  if (!item) {
    return;
  }

  if (event.keyCode === Keys.DOWN) {
    if (item.type === 'folder' && item.isExpanded.value) {
      const firstChild = item.children[0];
      if (firstChild) {
        current.value = firstChild;
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
      current.value = toSelect;
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
      current.value = item.parent;
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
    current.value = last;
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
        current.value = item.parent;
      }
    }
  }
};

const createFileExplorerHelper = async ({ dir, parent, index, extensions, select }: {
  dir: string,
  parent: Folder | null,
  index: number,
  extensions: Set<string>,
  select: (item: Folder | File) => void,
}): Promise<Folder> => {
  const tree: Folder = {
    type: 'folder',
    parent,
    index,
    path: dir,
    isExpanded: ref(false),
    isSelected: ref(false),
    children: [],
    select() { select(this); },
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
      const parts = item.split('.');
      const extension = parts[parts.length - 1];
      if (extensions.has(extension)) {
        tree.children.push({
          type: 'file',
          parent: tree,
          index: i,
          path: fullPath,
          isSelected: ref(false),
          value: fullPath,
          select() { select(this); },
        });
        i++;
      }
    } else {
      tree.children.push(await createFileExplorerHelper({ dir: fullPath, parent: tree, index: i, extensions, select }));
      i++;
    }

  }

  return tree;
};

type ThenArg<T> = T extends PromiseLike<infer U> ? U : T;
export type FileExplorerAPI = ThenArg<ReturnType<typeof createFileExplorer>>;

