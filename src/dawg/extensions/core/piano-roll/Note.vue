<template>
  <div class="note primary">
    <div 
      class="body"
      v-on="$listeners"
    ></div>

    <div 
      class="text"
      :style="textConfig"
    >
      {{ text }}
    </div>
    
  </div>
</template>

<script lang="ts">
import { Mixins, Prop, Component, Inject, Vue } from 'vue-property-decorator';
import { allKeys, createComponent } from '@/utils';
import { Watch } from '@/modules/update';
import { Note } from '@/core';
import { computed } from 'vue-function-api';

export default createComponent({
  name: 'Note',
  props: {
    pxPerBeat: { type: Number, required: true },
    width: { type: Number, required: true },
    element: { type: Object as () => Note, required: true },
    height: { type: Number, required: true },
    fontSize: { type: Number, default: 14 },
  },
  setup(props) {
    const noteName = computed(() => {
      return allKeys[props.element.row].value;
    });

    const textConfig = computed(() => {
      return {
        top: `${(props.height / 2) - ((props.fontSize / 2) + 1)}px`,
        color: '#fff',
        fontSize: `${props.fontSize}px`,
      };
    });

    const threshold = computed(() => {
      // 1.45 just seems to work well
      return props.fontSize * noteName.value.length / 1.45;
    });

    const text = computed(() => {
      return props.width > threshold.value ? allKeys[props.element.row].value : undefined;
    });

    return {
      text,
      textConfig,
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

.text, .drag, .body
  position: absolute

.text
  left: 3px
  user-select: none

.body
  width: 100%
  height: 100%

.note
  border-radius: 4px
  overflow: hidden

.selected
  background-color: #ff9999
</style>
