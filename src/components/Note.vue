<template>
  <div class="note__root">
    <v-rect :config="noteConfig" ref="note" @mousedown="emit" @contextmenu="emit"/>
    <v-text :config="textConfig"/>
    <v-rect
        :config="borderConfig"
        @mouseenter="onHover"
        @mouseleave="afterHover"
        @mousedown="(_, { evt }) => addListeners(evt)"
    ></v-rect>
  </div>
</template>

<script lang="ts">
import { VRect } from 'vue-konva';
import { Draggable } from '@/mixins';
import { Mixins, Prop, Component } from 'vue-property-decorator';

@Component
export default class Note extends Mixins(Draggable) {
  @Prop({ type: Number, required: true }) public height!: number;
  @Prop({ type: Number, required: true }) public width!: number;
  @Prop({ type: Number, default: 8 }) public borderWidth!: number;
  @Prop({ type: Number, default: 12 }) public fontSize!: number;
  @Prop({ type: Number, default: 0 }) public x!: number;
  @Prop({ type: Number, default: 0 }) public y!: number;
  @Prop({ type: Number, default: 4 }) public noteRadius!: number;
  @Prop(Number) public value!: number;
  @Prop(String) public text!: string;
  @Prop({ type: String, default: '#0f82e6' }) public color!: number;
  @Prop({ type: String, default: '#7ebef7' }) public borderColor!: number;
  @Prop({ type: String, default: '#fff' }) public textColor!: number;
  public cursor = 'ew-resize';
  public takeAway = 1; // we take away an extra pixel because it looks better

  public $refs!: {
    drag: HTMLElement,
    note: VRect,
  };

  get noteConfig() {
    return {
      width: (this.width * this.value) - this.takeAway,
      height: this.height,
      fill: this.color,
      cornerRadius: this.noteRadius,
      x: this.x,
      y: this.y,
    };
  }
  get borderConfig() {
    return {
      width: this.borderWidth,
      height: this.height,
      fill: this.in ? this.borderColor : this.color,
      x: (this.x + (this.width * this.value)) - this.borderWidth - this.takeAway,
      y: this.y,
      cornerRadius: this.noteRadius,
    };
  }
  get textConfig() {
    return {
      text: this.text,
      x: this.x + 3,
      // the extra 1 makes it look better
      y: (this.y + (this.height / 2)) - ((this.fontSize / 2) + 1),
      fill: this.textColor,
    };
  }
  public move(e: MouseEvent, ...extra: any[]) {
    const originX = this.$refs.note.getStage().getX();
    const diff = e.clientX - originX;
    const length = Math.round(diff / this.width);

    if (this.value === length) { return; }
    if (length < 1) { return; }
    this.$emit('input', length);
  }
  public emit(_: any, { evt }: { evt: Event }) {
    this.$emit(evt.type, evt);
  }

  public process(handler: (evt: Event) => void) {
    return (_: any, { evt }: { evt: Event }) => handler(evt);
  }
}
</script>
