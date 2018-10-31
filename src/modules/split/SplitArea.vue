<template>
    <div :class="classes" style="">
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
  public $parent!: Parent;
  get classes() {
    return `split split-` + this.$parent.direction;
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
