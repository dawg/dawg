<template>
  <div class="base-tabs">
    <slot></slot>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { makeLookup, Nullable, createComponent, update } from '@/utils';
import { watch } from 'vue-function-api';

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


<style lang="sass" scoped>
.base-tabs
  height: 100%
</style>
