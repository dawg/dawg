<template>
  <div 
    :style="style"
    @click="click"
    :class="colorClass"
    @contextmenu="$event.preventDefault()"
  ></div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Inject } from 'vue-property-decorator';
import { allKeys } from '@/utils';

@Component
export default class SequencerRow extends Vue {
  @Inject() public pxPerBeat!: number;
  @Inject() public noteHeight!: number;
  @Prop({ type: Number, required: true }) public id!: number;
  @Prop({ type: Number, required: true }) public totalBeats!: number;

get colorClass() {
    const key = allKeys[this.id].value;
    return key.includes('#') ? 'secondary-darken-1' : 'secondary';
  }
  public get style() {
    return {
      height: `${this.noteHeight}px`,
      width: `${this.pxPerBeat * this.totalBeats}px`,
    };
  }
  public click(e: MouseEvent) {
    this.$emit('click', this.id, e);
  }
}
</script>

<style lang="sass" scoped>

</style>