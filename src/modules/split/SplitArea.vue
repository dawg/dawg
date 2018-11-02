<template>
  <div :class="classes" :style="style">
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
import { Parent } from '@/modules/split/types';

@Component
export default class SplitArea extends Vue {
  @Prop({type: Number, default: 50}) public size!: string;
  @Prop({type: Number, default: 100}) public minSize!: string;
  @Prop(Boolean) public grow!: boolean;
  public $parent!: Parent;
  public get classes() {
    return `split-` + this.$parent.direction;
  }
  public get style() {
    if (this.grow) {
      return {
        flex: '1',
      };
    }
  }
  @Watch('size')
  public onSizeChange() {
    this.$parent.changeAreaSize();
  }
  @Watch('minSize')
  public onMinSizeChange() {
    this.$parent.changeAreaSize();
  }
}
</script>
