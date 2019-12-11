<template>
  <div class="h-full">
    <slot></slot>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { makeLookup, Nullable, update } from '@/utils';
import { watch, createComponent } from '@vue/composition-api';

export default createComponent({
  name: 'BaseTabs',
  props: {
    selectedTab: String as () => string | undefined,
    first: String as () => string | undefined,
  },
  setup(props, context) {
    watch(() => props.first, () => {
      if (!props.selectedTab && props.first) {
        update(props, context, 'selectedTab', props.first);
      }
    });

    return {
      selectTab(name?: string | null, event?: MouseEvent) {
        if (event) { event.preventDefault(); }
        if (!name) { return; }
        update(props, context, 'selectedTab', name);
      },
    };
  },
});
</script>
