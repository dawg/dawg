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

<script>
import { draggable, konva } from '@/mixins';

export default {
  name: 'Note',
  props: {
    height: { type: Number, required: true },
    width: { type: Number, required: true },
    borderWidth: { type: Number, default: 8 },
    fontSize: { type: Number, default: 12 },
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    noteRadius: { type: Number, default: 4 },
    value: Number,
    text: String,
    color: { type: String, default: '#0f82e6' },
    borderColor: { type: String, default: '#7ebef7' },
    textColor: { type: String, default: '#fff' },
  },
  mixins: [draggable, konva],
  data() {
    return {
      cursor: 'ew-resize',
      takeAway: 1, // we take away an extra pixel because it looks better
    };
  },
  computed: {
    noteConfig() {
      return {
        width: (this.width * this.value) - this.takeAway,
        height: this.height,
        fill: this.color,
        cornerRadius: this.noteRadius,
        x: this.x,
        y: this.y,
      };
    },
    borderConfig() {
      return {
        width: this.borderWidth,
        height: this.height,
        fill: this.in ? this.borderColor : this.color,
        x: (this.x + (this.width * this.value)) - this.borderWidth - this.takeAway,
        y: this.y,
        cornerRadius: this.noteRadius,
      };
    },
    textConfig() {
      return {
        text: this.text,
        x: this.x + 3,
        // the extra 1 makes it look better
        y: (this.y + (this.height / 2)) - ((this.fontSize / 2) + 1),
        fill: this.textColor,
      };
    },
  },
  methods: {
    move(e) {
      const originX = this.$refs.note.getStage().getX();
      const diff = e.clientX - originX;
      const length = Math.round(diff / this.width);

      if (this.value === length) return;
      if (length < 1) return;
      this.$emit('input', length);
    },
  },
};
</script>
