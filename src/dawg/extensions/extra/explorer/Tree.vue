<template>
  <div style="display: contents">
    <drag 
      @click.native="select"
      @mousedown.native="loadData"
      class="flex items-center hover-pointer py-1 px-2 hover:bg-default-lighten-2"
      :class="nodeClass" 
      :style="textStyle"
      :group="dragGroup"
      :transfer-data="transferData"
      :draggable="draggable"
    >
      <component
        v-if="isLeaf"
        :is="iconComponent"
      ></component>
      <dg-fa-icon
        class="text-default"
        v-else 
        :style="iconStyle"
        icon="caret-right"
      ></dg-fa-icon>
      
      <div class="text-default ml-2 text-sm select-none truncate">
        {{ fileName }}
      </div>

    </drag>
    <div v-if="isExpanded">
      <tree
        ref="trees"
        v-for="(child, i) in children"
        :key="child.path"
        :path="child.path"
        :item="child"
        :extensions="extensions"
        :depth="depth + 1"
        :index="i"
      ></tree>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import path from 'path';
import { Keys } from '@/lib/std';
import { Component, Prop } from 'vue-property-decorator';
import { Folder, File, Extensions, Extension, ExtensionData } from '@/dawg/extensions/extra/explorer/types';
import { Watch } from '@/update';
import { createComponent, computed, Ref, ref, watch } from '@vue/composition-api';

export default createComponent({
  name: 'Tree',
  props: {
    item: { type: Object as () => Folder | File, required: true },

    /**
     * See the FileExplorer.
     */
    extensions: { type: Object as () => Extensions, required: true },

    /**
     * The depth. You don't need to set this as it will be set automatically.
     */
    depth: { type: Number, default: 0 },
  },
  setup(props, context) {
    let data: object | null = null;
    const transferData: Ref<any> = ref(null);

    const isExpanded = computed(() => {
      return props.item.type === 'folder' && props.item.isExpanded.value;
    });

    const draggable = computed(() => {
      return !!transferData.value;
    });

    const marginLeft = computed(() => {
      return `${props.depth * 10 + 4}px`;
    });

    const showChildren = computed(() => {
      return props.item.type === 'folder' && props.item.isExpanded.value;
    });

    const iconStyle = computed(() => {
      return {
        marginLeft: marginLeft.value,
        transform: `rotate(${showChildren.value ? 45 : 0}deg)`,
      };
    });

    const textStyle = computed(() => {
      return {
        paddingLeft: marginLeft.value,
      };
    });

    const isLeaf = computed(() => {
      return props.item.type === 'file';
    });

    const children = computed(() => {
      if (props.item.type === 'file') {
        // The folders attribute should never be used if this is a leaf.
        // If it is, and empty list will be returned.
        return [];
      } else {
        return props.item.children;
      }
    });

    const nodeClass = computed(() => {
      return props.item.isSelected.value ? 'bg-default-lighten-1' : '';
    });

    const fileName = computed(() => {
      return path.basename(props.item.path);
    });

    const extension = computed((): Extension | null => {
      if (isLeaf.value) {
        const parts = props.item.path.split('.');

        // This is ok because we filter
        return parts[parts.length - 1] as Extension;
      } else {
        return null;
      }
    });

    const extensionData = computed((): ExtensionData<any, any> => {
      if (!extension.value) {
        return {
          dragGroup: '',
          iconComponent: '',
          load: () => ({}),
          createTransferData: () => ({}),
          preview: () => ({ dispose: () => ({}) }),
        };
      }

      return props.extensions[extension.value];
    });

    const dragGroup = computed(() => {
      return extensionData.value.dragGroup;
    });

    const iconComponent = computed(() => {
      return extensionData.value.iconComponent;
    });

    let disposer: { dispose: () => void } | null = null;
    watch(props.item.isSelected, async () => {
      if (!isLeaf.value) {
        return;
      }

      if (data === null) {
        await loadData();
      }

      if (disposer) {
        disposer.dispose();
        disposer = null;
      }

      if (props.item.isSelected.value) {
        if (disposer) {
          disposer = null;
        }

        if (extensionData.value.preview) {
          disposer = extensionData.value.preview(data);
        }
      }
    }, { lazy: true });

    async function loadData() {
      if (data) {
        return;
      }

      // always await
      data = await extensionData.value.load(props.item.path);
      if (extensionData.value.createTransferData) {
        transferData.value = extensionData.value.createTransferData(data);
      }
    }

    return {
      loadData,
      nodeClass,
      textStyle,
      isLeaf,
      iconComponent,
      iconStyle,
      dragGroup,
      transferData,
      draggable,
      fileName,
      isExpanded,
      children,
      select: () => {
        props.item.select();
      },
    };
  },
});
</script>
