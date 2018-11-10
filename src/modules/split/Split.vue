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
  @Prop(Boolean) public collapsible!: boolean;
  @Prop(Boolean) public resizable!: boolean;
  @Prop({type: Number, default: 10}) public minSize!: number;
  @Prop({type: Number, default: Infinity}) public maxSize!: number;
  @Prop(Number) public initial?: number;
  public $children!: Split[];
  public $parent!: Split;

  // We set some of the defaults here so we can view them in vue-devtools
  // If no defaults are set, we do not see them...
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
      // After includes $children[i].
      // This makes sense if you think about it since the gutter is on the left/top of the element!
      child.after = this.$children.slice(i);
    });

    if (this.direction === 'horizontal') {
      this.size = this.$el.clientWidth;
    } else {
      this.size = this.$el.clientHeight;
    }

    let remaining = this.size;
    let free = 0;
    let set = 0;
    this.$children.forEach((split) => {
      if (!split.initial) {
        free += 1;
        return;
      }
      set += 1;
      remaining -= split.initial;
    });

    if (!remaining && !free) {
      throw new Error(`${remaining} remains and there is no freedom to adjust elements`);
    }

    const remainingPercentage = (remaining / this.size) * 100 / free;
    this.$children.forEach((split) => {
      const percentage = ((split.initial || 0) / this.size) * 100 || remainingPercentage;
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

    if (!px) { return; }

    let inFront: Split[];
    let behind: Split[];

    if (px > 0) {
      inFront = this.after;
      behind = this.before;
    } else {
      inFront = this.before;
      behind = this.after;
    }

    let pxBehind = 0;
    const atMax = (split: Split) => {
      pxBehind += split.maxSize - split.childSize!;
    };

    let pxInFront = 0;
    const atMin = (split: Split) => {
      pxInFront += split.childSize! - split.minSize;
    };

    behind.forEach(atMax);
    inFront.forEach(atMin);

    const sign = Math.sign(px);
    px = Math.min(pxBehind, pxInFront, Math.abs(px)) * sign;

    this.calculatePositions(this.before, px, px);
    this.calculatePositions(this.after, -px, px);
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
  public calculatePositions(splits: Split[], px: number, max: number) {
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
