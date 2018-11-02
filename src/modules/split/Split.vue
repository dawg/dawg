<template>
    <div class="split" :style="style">
        <slot></slot>
    </div>
</template>

<script lang="ts">
import split from 'split.js';
import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
import { Parent, Direction, Child } from '@/modules/split/types';

@Component
export default class Split extends Vue implements Parent {
  @Prop({type: String, default: 'horizontal'}) public direction!: Direction;
  @Prop({type: Number, default: 8}) public gutterSize!: number;
  public elements: HTMLElement[] = [];
  public sizes: number[] = [];
  public minSizes: number[] = [];
  public instance: split.Instance | null = null;
  public $children!: Child[];
  public get style() {
    if (this.direction === 'vertical') {
      return {
        flexDirection: 'column',
      };
    }
  }
  public changeAreaSize() {
    this.sizes = [];
    this.minSizes = [];
    this.$children.forEach((vnode) => {
      this.sizes.push(vnode.size);
      this.minSizes.push(vnode.minSize);
    });
  }
  public mounted() {
    this.elements = this.$children.map((child) => child.$el);
  }

}
</script>

<style lang="sass" scoped>
.split
  display: flex
</style>


