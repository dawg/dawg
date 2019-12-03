<template>
  <div class="icon__wrapper">
    <v-tooltip :right="right" :left="left" :top="top" :bottom="bottom" z-index="2000">
      <template slot="activator">
        <icon v-if="fa" :name="icon" :style="style" v-bind="$attrs"></icon>
        <v-icon v-else class="icon" :style="style" v-bind="$attrs">{{ icon }}</v-icon>
      </template>
      <span>{{ tooltip }}</span>
    </v-tooltip>
    <slot v-if="false"></slot>
  </div>
</template>

<script lang="ts">
import { createComponent, computed } from '@vue/composition-api';

export default createComponent({
  name: 'TooltipIcon',
  props: {
    fa: { type: Boolean, default: false },
    right: { type: Boolean, default: false },
    left: { type: Boolean, default: false },
    top: { type: Boolean, default: false },
    bottom: { type: Boolean, default: false },
    tooltip: { type: String, required: true },
    color: { type: String, default: 'white' },
  },
  setup(props, context) {
    const icon = computed(() => {
      const slot = context.slots.default();
      if (!slot || !slot[0]) {
        return '';
      }

      const text = slot[0].text || '';
      return text.trim();
    });

    const showTooltip = computed(() => {
      return !!props.tooltip;
    });

    const style = computed(() => {
      return { color: props.color };
    });

    return {
      style,
      showTooltip,
      icon,
    };
  },
});
</script>

<style lang="sass" scoped>
.icon__wrapper:hover
  cursor: pointer

// IDK why we need this? It also hardcodes 28px which isn't good
// If you remove this, the patterns tooltip will be super weird...
.icon__wrapper /deep/ .v-icon
  max-width: 28px
</style>