<template>
  <div class="channel-select screen secondary" ref="drag">
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
      this.$emit('input', Math.min(newValue, 9));
    }
  }

  public scrollMove({ y }: { y: number }) {
    const current = this.value === null ? -1 : this.value;
    const newValue = current + y;
    if (newValue < 0) {
      this.$emit('input', null);
    } else {
      this.$emit('input', Math.min(newValue, 9));
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
</style>