<template>
  <div class="note bg-primary">
    <div 
      class="body"
      v-on="$listeners"
    ></div>

    <div 
      class="absolute text-sm text-default select-none pl-1"
      :style="textStyle"
    >
      {{ text }}
    </div>
    
  </div>
</template>

<script lang="ts">
import { Mixins, Prop, Component, Inject, Vue } from 'vue-property-decorator';
import { allKeys } from '@/utils';
import { Watch } from '@/modules/update';
import { Note } from '@/core';
import { computed, createComponent } from '@vue/composition-api';

export default createComponent({
  name: 'Note',
  props: {
    pxPerBeat: { type: Number, required: true },
    width: { type: Number, required: true },
    element: { type: Object as () => Note, required: true },
    height: { type: Number, required: true },
  },
  setup(props) {
    const noteName = computed(() => {
      return allKeys[props.element.row].value;
    });

    const textStyle = computed(() => {
      return {
        lineHeight: `${props.height}px`,
      };
    });

    const threshold = computed(() => {
      // TODO fix this somehow??
      return 12;
    });

    const text = computed(() => {
      return props.width > threshold.value ? allKeys[props.element.row].value : undefined;
    });

    return {
      text,
      textStyle,
    };
  },
});

@Component
export class NNN extends Vue {


}
</script>

<style lang="sass" scoped>
.note
  position: relative

.drag, .body
  position: absolute

.body
  width: 100%
  height: 100%

.note
  border-radius: 4px
  overflow: hidden

.selected
  background-color: #ff9999
</style>
