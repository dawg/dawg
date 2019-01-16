<template>
  <div 
    class="note"
    :class="{primary: !selected, selected}"
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

    <div
      class="drag"
      :class="{'primary-lighten-3': this.in && !this.selected, in: this.in}"
      :style="borderConfig"
      @mouseenter="onHover"
      @mouseleave="afterHover"
      @mousedown="addListeners"
    ></div>
    
  </div>
</template>

<script lang="ts">
import { Draggable } from '@/mixins';
import { Mixins, Prop, Component, Inject } from 'vue-property-decorator';
import { allKeys } from '@/utils';

@Component
export default class Note extends Mixins(Draggable) {
  @Inject() public snap!: number;
  @Inject() public noteHeight!: number;
  @Inject() public pxPerBeat!: number;

  @Prop({ type: Number, required: true }) public start!: number;  // The start beat
  @Prop({ type: Number, required: true }) public id!: number;
  @Prop({ type: Number, default: 8 }) public borderWidth!: number;
  @Prop({ type: Number, default: 14 }) public fontSize!: number;
  @Prop(Number) public value!: number;  // The length
  @Prop(Boolean) public selected!: boolean;

  public cursor = 'ew-resize';

  get noteConfig() {
    // we take away an extra pixel because it looks better
    return {
      width: `${this.pxLength - 1}px`,
      height: `${this.noteHeight}px`,
      left: `${this.left}px`,
      top: `${this.top}px`,
    };
  }
  get top() {
    return this.id * this.noteHeight;
  }
  get text() {
    return allKeys[this.id].value;
  }

  get left() { return this.start * this.pxPerBeat; }
  get pxLength() { return this.value * this.pxPerBeat; }
  get borderConfig() {
    // We also take away an extra pixel because it looks better
    return {
      width: `${this.borderWidth}px`,
      height: `${this.noteHeight}px`,
      left: `${this.pxLength - this.borderWidth - 1}px`,
    };
  }
  get textConfig() {
    return {
      top: `${(this.top + (this.noteHeight / 2)) - ((this.fontSize / 2) + 1)}px`,
      color: '#fff',
      fontSize: `${this.fontSize}px`,
    };
  }
  public move(e: MouseEvent) {
    const diff = e.clientX - this.$el.getBoundingClientRect().left;
    let length = diff / this.pxPerBeat;
    length = Math.round(length / this.snap) * this.snap;
    if (this.value === length) { return; }
    if (length < this.snap) { return; }
    this.$emit('input', length);
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

  & .drag.in
    background-color: #ffcccc
</style>
