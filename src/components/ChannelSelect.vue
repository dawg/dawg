<template>
  <div class="channel-select screen" ref="drag">
    <div style="line-height: 38px">{{ display }}</div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Mixins } from 'vue-property-decorator';
import { Nullable } from '@/utils';
import { Draggable } from '@/mixins';

@Component
export default class ChannelSelect extends Mixins(Draggable) {
  @Prop(Nullable(Number)) public value!: number;

  public cursor = 'ns-resize';
  public factor = 0.2;
  public leftover = 0;

  get display() {
    return this.value === null ? '——' : this.value;
  }

  public move(e: MouseEvent) {
    const current = this.value === null ? -1 : this.value;
    const goingUp = e.movementY < 0;
    const mouvement = Math.abs(e.movementY) * this.factor + this.leftover;
    this.leftover = mouvement % 1;

    const newValue = goingUp ? current + Math.floor(mouvement) : current - Math.floor(mouvement);
    if (newValue < 0) {
      this.$emit('input', null);
    } else {
      this.$emit('input', newValue);
    }
  }
}
</script>

<style lang="sass" scoped>
@import '~@/styles/screen'
.channel-select
  min-width: 40px
  display: flex
  justify-content: center
//   position: relative

// .after::after
//   position: absolute
//   top: 0
//   left: 0
//   right: 0
//   bottom: 0
//   content: ''
//   background-image: linear-gradient(to top, rgba(#fff,.2) 33.33333%, rgba(#fff,.4) 33.33333%, rgba(#fff,.4) 66.66666%, rgba(#fff,.6) 66.66666%), linear-gradient(to right, rgba(#f00,.7) 33.33333%, rgba(#0f0,.7) 33.33333%, rgba(#0f0,.7) 66.66666%, rgba(#00f,.7) 66.66666%)
//   background-size: 3px 3px
//   mix-blend-mode: multiply
</style>