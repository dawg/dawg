<template>
  <div class="progress absolute" :style="style">
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Inject } from 'vue-property-decorator';
import { createComponent, computed, ref, watch } from '@vue/composition-api';

export default createComponent({
  name: 'Progression',
  props: {
    pxPerBeat: { type: Number, required: true },
    // Range from 0 to 1
    position: { type: Number, required: true },
    scrollLeft: { type: Number, required: true },
    // Since the progress is a range from 0-1, this needs the bounds to calculate the position.
    loopStart: { type: Number, required: true },
    loopEnd: { type: Number, required: true },
  },
  setup(props) {
    const progressPx = computed(() => {
      return (props.position * props.pxPerBeat) + 'px';
    });

    const style = computed(() => {
      return {
        left: progressPx.value,
      };
    });

    return {
      style,
    };
  },
});
</script>
