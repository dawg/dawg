<template>
  <div 
    class="note"
    :class="{ primary: !selected, selected }"
    :style="noteConfig" 
  >
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

    <resizable
      class="drag"
      :duration="duration"
      @update:duration="updateDuration"
      :hover-color="resizeAreaColor"
      hover-class="primary-lighten-3"
    ></resizable>
    
  </div>
</template>

<script lang="ts">
import { Draggable } from '@/modules/draggable';
import { Mixins, Prop, Component, Inject } from 'vue-property-decorator';
import { allKeys } from '@/utils';
import { Positionable } from '@/modules/sequencer/sequencer';
import Resizable from '@/modules/sequencer/Resizable.vue';

@Component({
  components: { Resizable },
})
export default class TestItem extends Mixins(Positionable) {
  @Inject() public pxPerBeat!: number;

  @Prop({ type: Number, required: true }) public left!: number;
  @Prop({ type: Number, required: true }) public top!: number;
  @Prop({ type: Number, required: true }) public row!: number;
  @Prop({ type: Number, default: 8 }) public borderWidth!: number;
  @Prop({ type: Number, default: 14 }) public fontSize!: number;
  @Prop({ type: Boolean, required: true }) public selected!: boolean;

  get resizeAreaColor() {
    if (this.selected) {
      return '#ffcccc';
    }
  }

  get noteConfig() {
    // we take away an extra pixel because it looks better
    return {
      width: `${this.width - 1}px`,
      height: `${this.height}px`,
      left: `${this.left}px`,
      top: `${this.top}px`,
    };
  }

  get text() {
    return allKeys[this.row].value;
  }

  get borderConfig() {
    // We also take away an extra pixel because it looks better
    return {
      width: `${this.borderWidth}px`,
      height: `${this.height}px`,
      left: `${this.width - this.borderWidth - 1}px`,
    };
  }

  get textConfig() {
    return {
      top: `${(this.top + (this.height / 2)) - ((this.fontSize / 2) + 1)}px`,
      color: '#fff',
      fontSize: `${this.fontSize}px`,
    };
  }

  public updateDuration(value: number) {
    this.$update('duration', value);
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
