<template>
  <div class="split" :style="style">
    <div 
      class="gutter"  
      v-if="gutter"
      :style="gutterStyle"
      @mousedown="addListeners"
      @mouseup="removeListeners"
      @mouseenter="onHover"
      @mouseleave="afterHover"
    ></div>
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
  @Prop(Boolean) public keep!: boolean;
  @Prop(Boolean) public fixed!: boolean;
  @Prop(Boolean) public collapsible!: boolean;
  @Prop(Boolean) public resizable!: boolean;
  @Prop({type: Number, default: 10}) public minSize!: number;
  @Prop({type: Number, default: Infinity}) public maxSize!: number;
  @Prop(Number) public initial?: number;
  @Prop({type: Number, default: 6}) public gutterSize!: number;

  public children!: Split[];
  public parent?: Split;

  // We set some of the defaults here so we can view them in vue-devtools
  // If no defaults are set, we do not see them...
  public gutter = false;
  public before: Split[] = [];  // Splits before gutter
  public after: Split[] = []; // Splits after gutter (including this Split)
  public size: number = 0;  // current size in px (width or height)

  public mounted() {
    const isSplit = (vue: Vue) => {
      // @ts-ignore
      return vue.constructor.options.name === Split.name;
    };

    if (isSplit(this.$parent)) {
      this.parent = this.$parent as Split;

      if (this.parent.axes === 'width') {
        this.cursor = 'ew-resize';
      } else if (this.parent.axes === 'height') {
        this.cursor = 'ns-resize';
      }
    }

    this.children = this.$children.filter(isSplit) as Split[];
    this.children.map((child, i) => {
      child.before = this.children.slice(0, i).reverse();
      // After includes $children[i].
      // This makes sense if you think about it since the gutter is on the left/top of the element!
      child.after = this.children.slice(i);
    });

    if (!this.resizable) { return; }
    this.children.slice(1).forEach((child, i) => child.gutter = !this.children[i].fixed);

    if (!this.isRoot) {
      return;
    }

    window.addEventListener('resize', this.onResize);
    this.size = this.getSize();
    this.init();
  }

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
    if (this.parent!.axes === 'width') {
      return {
        height: '100%',
        width: `${this.gutterSize}px`,
        marginLeft: `${-this.gutterSize / 2}px`,
      };
    } else {
      return {
        width: '100%',
        height: `${this.gutterSize}px`,
        marginTop: `${-this.gutterSize / 2}px`,
      };
    }
  }
  get childrenReversed() {
    return this.children.reverse();
  }

  public destroyed() {
    if (!this.isRoot) {
      return;
    }

    window.removeEventListener('resize', this.onResize);
  }

  public onResize() {
    const size = this.getSize();
    const px = size - this.size;
    console.log(px);
    this.size = size;
    this.calculatePositions(this.childrenReversed, px);
  }
  public move(e: MouseEvent, { changeY, changeX }: { changeY: number, changeX: number }) {
    let px;
    if (this.parent!.direction === 'horizontal') {
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
    behind.forEach((split: Split) => {
      if (split.fixed) { return; }
      pxBehind += split.maxSize - split.size!;
    });

    let pxInFront = 0;
    inFront.forEach((split: Split) => {
      if (split.fixed) { return; }
      pxInFront += split.size! - split.minSize;
    });

    const sign = Math.sign(px);
    px = Math.min(pxBehind, pxInFront, Math.abs(px)) * sign;

    this.calculatePositions(this.before, px);
    this.calculatePositions(this.after, -px);
  }
  public get isRoot() {
    return !this.parent;
  }
  public get axes() {
    if (!this.direction) {
      return null;
    }

    return this.direction === 'horizontal' ? 'width' : 'height';
  }
  public calculatePositions(splits: Split[], px: number) {
    // First resize but don't include children that have keep flag
    // Then resize again but include the children with a keep flag
    const pxLeft = this.doResize(splits, { px, includeKeep: false });
    this.doResize(splits, { px: pxLeft, includeKeep: true });
  }
  public doResize(splits: Split[], { includeKeep, px }: { includeKeep: boolean, px: number }) {
    for (const split of splits) {
      if (px === 0) { break; }
      if (split.fixed) { continue; }
      if (split.keep && !includeKeep) { continue; }

      const size = split.size!;
      const newSize = Math.max(split.minSize, Math.min(size + px, split.maxSize));
      split.size = newSize;
      px -= newSize - size;
    }
    return px;
  }
  public getSize() {
    if (this.direction === 'horizontal') {
      return this.$el.clientWidth;
    } else {
      return this.$el.clientHeight;
    }
  }
  public init() {
    let remaining = this.getSize();
    const numNotSet = this.children.filter((child) => !child.initial).length;
    this.children.forEach((split) => {
      if (split.initial) {
        split.size = split.initial;
        remaining -= split.size;
      }
    });

    const size = remaining / numNotSet;
    this.children.forEach((split) => {
      if (!split.initial) {
        split.size = size;
      }
    });

    this.children.forEach((split) => {
      split.init();
    });
  }
  public computeSizes() {
    if (this.children.length === 0) {
      return;
    }

    let remaining = this.getSize();

    let free = 0;
    let set = 0; // # of elements set to an inital value
    this.children.forEach((split) => {
      if (!split.fixed && !split.keep) {
        free += 1;
        return;
      }

      set += 1;
      remaining -= split.size;
    });

    this.children.forEach((split) => {
      split.size = split.initial || remaining / free;
    });
  }

  @Watch('size')
  public onSizeChange() {
    if (!this.parent) { return; }
    this.$el.style[this.parent!.axes!] = this.size + 'px';
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
