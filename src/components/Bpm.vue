<template>
  <drag-element class="text-default flex items-baseline select-none" cursor="ns-resize" @move="move">
    <div class="text-3xl">{{ value }}</div>
    <div class="text-xs ml-1">bpm</div>
  </drag-element>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator';
import { createComponent } from '@vue/composition-api';

export default createComponent({
  name: 'Bpm',
  props: {
    value: { type: Number, required: true },
  },
  setup(props, context) {
    return {
      move: (e: MouseEvent) => {
        context.emit('input', Math.max(0, props.value - e.movementY));
      },
    };
  },
});
</script>
