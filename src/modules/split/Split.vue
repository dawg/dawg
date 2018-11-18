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
import * as _ from '@/_';

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
  public height: number = 0;  // current size in px (width or height)
  public width: number = 0;  // current size in px (width or height)

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

    this.children.slice(1).forEach((child, i) => {
      child.gutter = !this.children[i].fixed && !this.children[i + 1].fixed;
    });

    if (!this.isRoot) {
      return;
    }

    this.height = window.innerHeight;
    this.width = window.innerWidth;

    window.addEventListener('resize', this.onResizeEvent);
    this.init();
  }

  public destroyed() {
    if (!this.isRoot) {
      return;
    }

    window.removeEventListener('resize', this.onResizeEvent);
  }

  public onResizeEvent() {
    this.onResize();
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
    // The margin makes sure the gutter is centered on the line
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
    return this.children.slice().reverse();
  }

  public onResize(px?: number) {
    // We don't resize elements that don't have a direction.
    if (!this.direction) { return; }
    // console.log('onResize', px);

    let previous: number;
    let current: number;
    if (this.direction === 'horizontal') {
      previous = this.width;
    } else {
      previous = this.height;
    }

    if (px === undefined) {
      current = this.getSize();
      px = current - previous;
    } else {
      current = previous + px;
    }


    // const before = this.children.map((child) => child.size);
    console.log(this.direction, previous, current, px, this.$el);
    this.calculatePositions(this.childrenReversed, px);
    // const after = this.children.map((child) => child.size);
    // const amounts = _.zip(before, after).map(([bef, aft]) => aft - bef);

    if (this.direction === 'horizontal') {
      this.width = current;
    } else {
      this.height = current;
    }

    // _.zip(this.children, amounts).forEach(([child, amount]) => child.onResize(amount));
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
      pxBehind += split.maxSize - split.childSize;
    });

    let pxInFront = 0;
    inFront.forEach((split: Split) => {
      if (split.fixed) { return; }
      pxInFront += split.childSize - split.minSize;
    });

    const sign = Math.sign(px);
    px = Math.min(pxBehind, pxInFront, Math.abs(px)) * sign;

    this.calculatePositions(this.before, px);
    this.calculatePositions(this.after, -px);
  }
  public get isRoot() {
    return !this.parent;
  }
  public get childSize() {
    if (this.parent!.direction === 'horizontal') {
      return this.width;
    } else {
      return this.height;
    }
  }
  public setChildSize(size: number) {
    if (this.parent!.direction === 'horizontal') {
      this.width = size;
    } else {
      this.height = size;
    }
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

      const size = split.childSize;
      const newSize = Math.max(split.minSize, Math.min(size + px, split.maxSize));
      split.setChildSize(newSize);
      console.log('Changing', split.$el, 'by', newSize - size, 'from', size, 'to', newSize);
      px -= newSize - size;
    }
    return px;
  }
  public getSize() {
    if (this.direction === 'horizontal') {
      if (this.parent) {
        return this.parent.width;
      } else {
        return window.innerWidth;
      }
    } else {
      if (this.parent) {
        return this.parent.width;
      } else {
        return window.innerHeight;
      }
    }
  }
  public init() {
    if (!this.direction) { return; }

    console.log('Initializing', this.$el);
    let remaining = this.getSize();

    const numNotSet = this.children.filter((child) => !child.initial).length;
    this.children.forEach((split) => {
      if (this.direction === 'horizontal') {
        split.height = this.height;
      } else {
        split.width = this.width;
      }

      if (split.initial) {
        if (this.direction === 'horizontal') {
          split.width = split.initial;
        } else {
          split.height = split.initial;
        }
        remaining -= split.initial;
      }
    });

    const size = remaining / numNotSet;
    this.children.forEach((split) => {
      if (!split.initial) {
        if (this.direction === 'horizontal') {
          split.width = size;
        } else {
          split.height = size;
        }
      }
    });

    this.children.forEach((split) => {
      split.init();
    });
  }

  // @Watch('size')
  // public onSizeChange() {
  //   if (!this.parent) { return; }

  //   if (!this.parent.axes) {
  //     throw new Error('Parent axes was not defined. Something went wrong!');
  //   }

  //   if (this.parent.axes === 'width') {
  //     this.width = this.size;
  //   } else {
  //     this.height = this.size;
  //   }

  //   this.$el.style[this.parent.axes] = this.size + 'px';
  // }

  @Watch('height')
  public onHeightChange() {
    this.$el.style.height = this.height + 'px';
  }

  @Watch('width')
  public onWidthChange() {
    this.$el.style.width = this.width + 'px';
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
