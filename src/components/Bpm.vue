<template>
  <div class="screen" :ref="dragRef">
    <div class="text">{{ value }}</div>
    <div class="small-text">bpm</div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator';
import { Draggable } from '../mixins';

@Component
export default class Bpm extends Mixins(Draggable) {
  @Prop(Number) public value!: any;
  public move(e: Event, { changeY }: { changeY: number }) {
    this.$emit('input', this.value - changeY);
  }
}
</script>

<style scoped lang="sass">
  @import '~@/styles/screen'
</style>
