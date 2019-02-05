<template>
  <div class="split" :class="{resizable: direction, [direction]: true}">
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

const isSplit = (vue: Vue) => {
  // @ts-ignore
  return vue.constructor.options.name === Split.name;
};

@Component
export default class Split extends Mixins(Draggable) {
  @Prop(String) public direction?: Direction;
  @Prop(Boolean) public keep!: boolean;
  @Prop(Boolean) public fixed!: boolean;
  @Prop(Boolean) public collapsible!: boolean; // TODO
  @Prop({type: Number, default: 10}) public minSize!: number;
  @Prop({type: Number, default: Infinity}) public maxSize!: number;
  @Prop(Number) public initial?: number;
  @Prop({type: Number, default: 6}) public gutterSize!: number;

  public $el!: HTMLElement;
  public children!: Split[];
  public parent: Split | null = null; // giving initial null makes parent reactive!

  // We set some of the defaults here so we can view them in vue-devtools
  // If no defaults are set, we do not see them...
  public gutter = false;
  public before: Split[] = []; // Splits before gutter (left / top)
  public after: Split[] = []; // Splits after gutter (right / bottom)
  public height: number = 0;
  public width: number = 0;

  public mounted() {
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

    // There will never be a gutter for the first element
    this.children.slice(1).forEach((child, i) => {
      child.gutter = !this.children[i].fixed && !child.fixed;
    });

    if (!this.isRoot) { return; }
    this.height = window.innerHeight;
    this.width = window.innerWidth;

    window.addEventListener('resize', this.onResizeEvent);
    this.init();
  }

  public destroyed() {
    if (!this.isRoot) { return; }
    window.removeEventListener('resize', this.onResizeEvent);
  }

  public onResizeEvent() {
    this.calculatePositions([this], window.innerWidth - this.width, 'horizontal');
    this.calculatePositions([this], window.innerHeight - this.height, 'vertical');
  }

  public get gutterStyle() {
    if (!this.parent) { return; }

    // The margin makes sure the gutter is centered on the line
    if (this.parent.direction === 'horizontal') {
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

  public move(e: MouseEvent, { changeY, changeX }: { changeY: number, changeX: number }) {
    let px;
    if (this.parent!.direction === 'horizontal') {
      px = changeX;
    } else {
      px = changeY;
    }

    if (!px) { return; }

    const inFront = px > 0 ? this.after : this.before; // The splits in front of the movement
    const behind = px > 0 ? this.before : this.after; // The splits in behind of the movement

    let pxBehind = 0;
    for (const split of behind) {
      if (split.fixed) { continue; }
      pxBehind += split.maxSize - split.size;
    }

    let pxInFront = 0;
    for (const split of inFront) {
      if (split.fixed) { continue; }
      pxInFront += split.size - split.minSize;
    }

    px = Math.min(pxBehind, pxInFront, Math.abs(px)) * Math.sign(px);
    this.calculatePositions(this.before, px, this.parent!.direction!);
    this.calculatePositions(this.after, -px, this.parent!.direction!);
  }

  public get isRoot() {
    return !this.parent;
  }

  public get size() {
    if (this.parent!.direction === 'horizontal') {
      return this.width;
    } else {
      return this.height;
    }
  }

  public setSize(size: number) {
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

  public calculatePositions(splits: Split[], px: number, direction: Direction) {
    // First resize but don't include children that have keep flag
    // Then resize again but include the children with a keep flag
    const pxRemaining = this.doResize(splits, px, false, direction);
    this.doResize(splits, pxRemaining, true, direction);
  }

  public doResize(splits: Split[], px: number, includeKeep: boolean, direction: Direction) {
    if (splits.length === 0) { return px; }
    const child = splits[0]; // all children have the same parent

    if (child.parent && child.parent.direction === direction) {
      for (const split of splits) {
        if (px === 0) { break; }
        if (split.fixed) { continue; }
        if (split.keep && !includeKeep) { continue; }

        const newSize = Math.max(split.minSize, Math.min(split.size + px, split.maxSize));
        const diff = newSize - split.size;
        this.doResize(split.childrenReversed, diff, includeKeep, direction);
        split.setSize(newSize);
        this.$log.debug('Changing', split.$el, 'by', diff, 'from', split.size, 'to', newSize);
        px -= diff;
      }
    } else {
      for (const split of splits) {
        this.doResize(split.childrenReversed, px, includeKeep, direction);
        if (direction === 'horizontal') {
          const newSize = split.width + px;
          this.$log.debug('Changing width of ', split.$el, 'by', px, 'from', split.width, 'to', newSize);
          split.width = split.width + px;
        } else {
          const newSize = split.height + px;
          this.$log.debug('Changing height of ', split.$el, 'by', px, 'from', split.height, 'to', newSize);
          split.height = split.height + px;
        }
      }
      px = 0;
    }

    return px;
  }

  public init() {
    if (!this.direction) { return; }

    let remaining = this.direction === 'horizontal' ? this.width : this.height;
    this.children.forEach((split) => {
      if (this.direction === 'horizontal') {
        split.height = this.height;
      } else {
        split.width = this.width;
      }

      if (split.initial) {
        split.setSize(split.initial);
        remaining -= split.initial;
      }
    });

    const notInitialized = this.children.filter((child) => !child.initial);
    const size = remaining / notInitialized.length;
    this.$log.debug('Initializing', this.$el, remaining, notInitialized.length, size);
    notInitialized.forEach((split) => { split.setSize(size); });
    this.children.forEach((split) => { split.init(); });
  }

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

.resizable
  display: flex

.vertical
  flex-direction: column
</style>
