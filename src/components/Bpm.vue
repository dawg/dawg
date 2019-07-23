<template>
  <drag-element class="screen foreground--text" curse="ns-resize" @move="move">
    <div class="text">{{ value }}</div>
    <div class="small-text">bpm</div>
  </drag-element>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator';
import { DragElement } from '@/modules/draggable';
import { createComponent } from '@/utils';

export default createComponent({
  name: 'Bpm',
  components: { DragElement },
  props: {
    value: { type: Number, required: true },
  },
  setup(props, context) {
    return {
      move: (e: Event, { changeY }: { changeY: number }) => {
        context.emit('input', Math.max(0, props.value - changeY));
      },
    };
  },
});
</script>

<style scoped lang="sass">
  @import '~@/styles/screen'
</style>
