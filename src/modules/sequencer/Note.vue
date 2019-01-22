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
import { Draggable } from '@/modules/draggable';
import { Mixins, Prop, Component, Inject, Vue } from 'vue-property-decorator';
import { allKeys } from '@/utils';
import { Watch } from '@/modules/update';
import { Note as N } from '@/schemas';

@Component
export default class Note extends Vue {
  @Inject() public pxPerBeat!: number;

  @Prop({ type: Object, required: true }) public element!: N;
  @Prop({ type: Number, required: true }) public height!: number;
  @Prop({ type: Number, default: 14 }) public fontSize!: number;

  // TODO(jacob)
  // get resizeAreaColor() {
  //   if (this.selected) {
  //     return '#ffcccc';
  //   }
  // }

  get text() {
    return allKeys[this.element.row].value;
  }

  get textConfig() {
    return {
      top: `${(this.height / 2) - ((this.fontSize / 2) + 1)}px`,
      color: '#fff',
      fontSize: `${this.fontSize}px`,
    };
  }
}
</script>

<style lang="sass" scoped>
.note
  position: relative

.text, .drag, .body
  position: absolute

.text
  left: 3px

.body
  width: 100%
  height: 100%

.note
  border-radius: 4px
  overflow: hidden

.selected
  background-color: #ff9999
</style>
