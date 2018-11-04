<template>
  <div class="split" :style="style">
    <div class="gutter" ref="drag" :style="gutterStyle"></div>
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch, Mixins } from 'vue-property-decorator';
import { Draggable } from '@/mixins';

export type Direction = 'horizontal' | 'vertical';

@Component
export default class Split extends Mixins(Draggable) {
  @Prop(String) public direction?: Direction;
  @Prop(Boolean) public grow!: boolean;
  @Prop(Boolean) public resizable!: boolean;
  @Prop({type: Number, default: 10}) public minSize!: number;
  @Prop({type: Number, default: Infinity}) public maxSize!: number;
  public $children!: Split[];
  public $parent!: Split;
  public gutter = false;
  public size: number = 0;
  public before: Split[] = [];
  public after: Split[] = [];
  public childSize?: number;
  public position: number = 0;
  public get style() {
    const style: {[k: string]: any} = {};
    if (this.grow) {
      style.flex = '1';
    }

    if (this.direction) {
      style.display = 'flex';
      if (this.direction === 'vertical') {
        style.flexDirection = 'column';
      }
    }

    return style;
  }
  public get gutterStyle() {
    // We want the gutter to exist so that we can attach event listners
    // However, we don't want all gutters to actually show.
    if (!this.gutter) {
      return {};
    }

    if (this.parentAxes === 'width') {
      return {
        height: '100%',
        width: '6px',
        marginLeft: `${6 / -2}px`,
      };
    } else {
      return {
        width: '100%',
        height: '6px',
        marginTop: `${6 / -2}px`,
      };
    }
  }
  public mounted() {
    if (this.parentAxes === 'width') {
      this.cursor = 'ew-resize';
    } else {
      this.cursor = 'ns-resize';
    }

    if (!this.resizable) { return; }
    this.$children.slice(1).forEach((child) => child.gutter = true);
    this.$children.map((child, i) => {
      child.before = this.$children.slice(0, i).reverse();
      child.after = this.$children.slice(i); // Includes $children[i]
    });

    if (this.direction === 'horizontal') {
      this.size = this.$el.clientWidth;
    } else {
      this.size = this.$el.clientHeight;
    }

    const percentage = 100 / this.$children.length;
    this.$children.forEach((split) => {
      const size = split.$el.getBoundingClientRect()[this.axes];
      split.childSize = percentage / 100 * this.size;
      split.$el.style[this.axes] = percentage + '%';
    });
  }
  public move(e: MouseEvent, { changeY, changeX }: { changeY: number, changeX: number }) {
    let px;
    if (this.$parent.direction === 'horizontal') {
      px = changeX;
    } else {
      px = changeY;
    }

    let inFront: Split[];
    let behind: Split[];
    if (px > 0) {
      inFront = this.after;
      behind = this.before;
    } else {
      inFront = this.before;
      behind = this.after;
    }

    const atMax = (split: Split) => {
      return split.$el.getBoundingClientRect()[this.axes] >= split.maxSize;
    };

    const atMin = (split: Split) => {
      return split.$el.getBoundingClientRect()[this.axes] <= split.minSize;
    };

    const atLimit = (inFront.length && inFront.every(atMin)) || (behind.length && behind.every(atMax));
    if (atLimit) {
      return;
    }

    // TODO Calculate capacity!
    this.calculatePositions(this.before, px);
    this.calculatePositions(this.after, -px);
    this.position += px;
  }
  public get parentAxes() {
    return this.$parent.direction === 'horizontal' ? 'width' : 'height';
  }
  public get axes() {
    let direction;
    if (this.direction) {
      direction = this.direction;
    } else {
      direction = this.$parent.direction;
    }
    return direction === 'horizontal' ? 'width' : 'height';
  }
  public calculatePositions(splits: Split[], px: number) {
    for (const split of splits) {
      if (px === 0) { break; }

      const size = split.childSize!;
      const newSize = Math.max(split.minSize, Math.min(size + px, split.maxSize));
      split.childSize = newSize;
      split.$el.style[this.parentAxes] = (newSize / this.$parent.size) * 100 + '%';
      px -= newSize - size;
    }
  }
}
</script>

<style lang="sass" scoped>
.gutter
  position: absolute
  left: 0
  top: 0
  width: 100%
  z-index: 999

.split
  position: relative
</style>
