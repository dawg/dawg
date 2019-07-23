<template>
  <div class="split" :class="{ resizable: direction, [direction]: true }">
    <drag-element 
      class="gutter"
      v-if="gutter"
      :style="gutterStyle"
      :curse="cursor"
      @move="move"
    >
      <slot name="gutter"></slot>
    </drag-element>
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator';

export type Direction = 'horizontal' | 'vertical';

const isSplit = (vue: Vue): vue is Split => {
  return (vue.constructor as any as { options: { name: string } }).options.name === Split.name;
};

@Component
export default class Split extends Vue {
  @Prop(String) public direction?: Direction;
  @Prop(Boolean) public keep!: boolean;
  @Prop(Boolean) public fixed!: boolean;
  @Prop(Boolean) public collapsible!: boolean;
  @Prop({type: Number, default: 10}) public minSize!: number;
  @Prop({type: Number, default: Infinity}) public maxSize!: number;
  @Prop(Number) public initial?: number;
  @Prop({type: Number, default: 6}) public gutterSize!: number;
  @Prop({type: Number, default: 10}) public collapsePixels!: number;

  public $el!: HTMLElement;
  public children!: Split[];
  public parent: Split | null = null; // giving initial null makes parent reactive!

  // We set some of the defaults here so we can view them in vue-devtools
  // If no defaults are set, we do not see them...
  public gutter = false;
  public before: Split[] = []; // Splits before gutter (left / top)
  public after: Split[] = []; // Splits after gutter (right / bottom)
  public height = 0;
  public width = 0;

  public mousePosition = 0;

  get isRoot() {
    return !this.parent;
  }

  get size() {
    if (this.parent!.direction === 'horizontal') {
      return this.width;
    } else {
      return this.height;
    }
  }

  get gutterStyle() {
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

  get axes() {
    if (!this.direction) {
      return null;
    }

    return this.direction === 'horizontal' ? 'width' : 'height';
  }

  get childrenReversed() {
    return this.children.slice().reverse();
  }

  get collapsed() {
    return this.size < this.minSize;
  }

  get cursor() {
    if (this.parent) {
      if (this.parent.axes === 'width') {
        return 'ew-resize';
      } else {
        return 'ns-resize';
      }
    }
  }

  public mounted() {
    if (isSplit(this.$parent)) {
      this.parent = this.$parent;
    }

    this.children = this.$children.filter(isSplit);
    this.children.map((child, i) => {
      child.before = this.children.slice(0, i).reverse();
      // After includes $children[i].
      // This makes sense if you think about it since the gutter is on the left/top of the element!
      child.after = this.children.slice(i);
    });

    // There will never be a gutter for the first element
    this.children.slice(1).forEach((_, i) => {
      this.children[i + 1].gutter = !this.children[i].fixed && !this.children[i + 1].fixed;
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

  public gutterPosition() {
    if (!this.parent) {
      return 0;
    }

    const { left, top } = this.$el.getBoundingClientRect();
    return this.parent.direction === 'horizontal' ? left : top;
  }

  public onResizeEvent() {
    this.calculatePositions([this], window.innerWidth - this.width, 'horizontal');
    this.calculatePositions([this], window.innerHeight - this.height, 'vertical');
  }

  public move(e: MouseEvent) {
    if (!this.parent) {
      return;
    }

    if (!this.parent.direction) {
      return;
    }

    if (this.parent.direction === 'horizontal') {
      this.mousePosition = e.clientX;
    } else {
      this.mousePosition = e.clientY;
    }

    const px = this.mousePosition - this.gutterPosition();
    this.resize(px);
  }

  public resize(px: number) {
    if (!this.parent) {
      return;
    }

    if (!this.parent.direction) {
      return;
    }

    if (!px) { return; }

    const min = (...args: number[]) => {
      return Math.min(...args.map(Math.abs)) * Math.sign(px);
    };

    const max = (...args: number[]) => {
      let index = 0;
      args.forEach((value, i) => {
        if (Math.abs(value) > Math.abs(args[index])) {
          index = i;
        }
      });

      return args[index];
    };


    // Do the dry runs!
    const option1 = this.calculatePositions(this.before, px, this.parent.direction, true);
    const option2 = this.calculatePositions(this.after, -px, this.parent.direction, true);

    // Calculate the actual amount of pixels we are going to move!
    // We are just doing "dry runs" here
    px = min(
      max(
        option1,
        this.calculatePositions(this.before, -option2, this.parent.direction, true),
      ),
      max(
        option2,
        this.calculatePositions(this.after, -option1, this.parent.direction, true),
      ),
    );


    // The actual pixels moved (they might be different if something collapsed)
    this.calculatePositions(this.before, px, this.parent.direction);
    this.calculatePositions(this.after, -px, this.parent.direction);
  }

  public setSize(size: number) {
    if (this.parent!.direction === 'horizontal') {
      this.width = size;
    } else {
      this.height = size;
    }
  }

  /**
   * Resize the splits taking into account which splits should be resized first and which are collapsible.
   *
   * @param splits The splits.
   * @param px The amount of pixels to move. Either negative or positive.
   * @param direction The direction to move.
   * @returns The amount of pixels it actually moved.
   */
  public calculatePositions(splits: Split[], px: number, direction: Direction, dryRun = false) {
    // First resize but don't include children that have keep flag
    // Then resize again but include the children with a keep flag
    // Then resize anything that is collapsible
    let pxRemaining = this.doResize(splits, px, direction, { dryRun });
    pxRemaining = this.doResize(splits, pxRemaining, direction, { keep: true, dryRun });
    pxRemaining = this.doResize(splits, pxRemaining, direction, { collapsible: true, dryRun });
    return px - pxRemaining;
  }

  public doResize(
    splits: Split[],
    px: number,
    direction: Direction,
    opts?: { keep?: boolean, collapsible?: boolean, dryRun?: boolean },
  ) {
    const { keep = false, collapsible = false, dryRun = false } = opts || {};
    if (splits.length === 0) { return px; }
    const child = splits[0]; // all children have the same parent

    // Just a helper method
    const set = (s: Split, value: number, attr?: 'height' | 'width') => {
      if (!dryRun) {
        if (attr) {
          s[attr] = value;
        } else {
          s.setSize(value);
          s.$update('initial', value);
        }
      }
    };

    if (child.parent && child.parent.direction === direction) {
      for (const split of splits) {
        // We're done if px === 0
        if (px === 0) {
          break;
        }

        // Skip he fixed splits.
        if (split.fixed) {
          continue;
        }

        // If we aren't considering keep, skip the splits with `keep` flag
        if (split.keep && !keep) {
          continue;
        }

        // Trim the new size at the max and min. If collapsed, make sure that newSize stays at 0 until
        // we reach the min size of the split.
        let newSize = Math.max(split.minSize, Math.min(split.size + px, split.maxSize));
        if (split.collapsed && px < split.minSize) {
          newSize = 0;
        }

        // Check if we want to collapse
        // There is a bit of weird logic going on
        // Basically if
        // 1. The split is actually collapsible
        // 2. We are considering collapsible stuff
        // 3. The new size is the current size
        // 4. We've moved more than the amount of collapse pixels. This acts as a buffer.
        // 5. If it's a dry run OR if we want to move our size exactly. This is probably the most confusing
        // part and could maybe be refactored. This check is important though as we have to consider how much
        // other splits can move.
        if (split.collapsible && collapsible && newSize === split.size && px < -this.collapsePixels) {
          if (dryRun || -px === split.size) {
            newSize = 0;
          }
        }

        const diff = newSize - split.size;
        this.doResize(split.childrenReversed, diff, direction, { keep, collapsible, dryRun });
        set(split, newSize);

        px -= diff;
      }
    } else {
      for (const split of splits) {
        this.doResize(split.childrenReversed, px, direction, { keep, collapsible, dryRun });
        if (direction === 'horizontal') {
          const newSize = split.width + px;
          set(split, newSize, 'width');
        } else {
          const newSize = split.height + px;
          set(split, newSize, 'height');
        }
      }
      // This is definitely a bug
      // It won't appear until later though with embedded splits
      px = 0;
    }

    return px;
  }

  public init() {
    if (!this.direction) { return; }

    if (!this.parent && this.collapsible) {
      throw Error('The parent cannot be collapsible');
    }

    let remaining = this.direction === 'horizontal' ? this.width : this.height;
    this.children.forEach((split, i) => {
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

  @Watch('initial')
  public changeSize() {
    if (!this.parent) {
      return;
    }

    if (this.initial === this.size) {
      return;
    }

    if (this.initial === undefined) {
      return;
    }

    switch (this.parent.direction) {
      case 'horizontal':
        this.after[1].resize(this.initial - this.width);
        break;
      case 'vertical':
        this.resize(this.height - this.initial);
        break;
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

.resizable
  display: flex

.vertical
  flex-direction: column
</style>
