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
import { Mixins, Prop, Component } from 'vue-property-decorator';

// TODO It may be possible to encapsolate some of the x, y logic within the note :)
// TODO fontSize should actually be used for the font size lol
@Component
export default class Note extends Mixins(Draggable) {
  @Prop({ type: Number, required: true }) public height!: number;
  @Prop({ type: Number, required: true }) public width!: number;
  @Prop({ type: Number, default: 8 }) public borderWidth!: number;
  @Prop({ type: Number, default: 14 }) public fontSize!: number;
  @Prop({ type: Number, default: 0 }) public x!: number;
  @Prop({ type: Number, default: 0 }) public y!: number;
  @Prop(Number) public value!: number;
  @Prop(String) public text!: string;
  @Prop(Boolean) public selected!: boolean;
  @Prop({ type: String, default: '#fff' }) public textColor!: number;
  public cursor = 'ew-resize';
  public takeAway = 1;

  get noteConfig() {
    // we take away an extra pixel because it looks better
    return {
      width: `${(this.width * this.value) - 1}px`,
      height: `${this.height}px`,
      left: `${this.x}px`,
      top: `${this.y}px`,
    };
  }
  get borderConfig() {
    // We also take away an extra pixel because it looks better
    return {
      width: `${this.borderWidth}px`,
      height: `${this.height}px`,
      left: `${((this.width * this.value)) - this.borderWidth - 1}px`,
    };
  }
  get textConfig() {
    return {
      top: `${(this.y + (this.height / 2)) - ((this.fontSize / 2) + 1)}px`,
      color: this.textColor,
    };
  }
  public move(e: MouseEvent) {
    const diff = e.clientX - this.$el.getBoundingClientRect().left;
    const length = Math.round(diff / this.width);
    if (this.value === length) { return; }
    if (length < 1) { return; }
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

// TODO These colors are currently harcoded. We could possible make them props.
.selected
  background-color: #ff9999

  & .drag.in
    background-color: #ffcccc
</style>
