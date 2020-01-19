<template>
  <div ref="el" class="relative" :class="{ flex: direction, 'flex-col': direction === 'vertical' }">
    <drag-element 
      class="absolute gutter"
      v-if="i.gutter"
      :style="gutterStyle"
      :cursor="cursor"
      @move="move"
    ></drag-element>
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { watch, Ref, ref, createComponent, computed, onMounted, onUnmounted } from '@vue/composition-api';
import { update } from '@/utils';

export type Direction = 'horizontal' | 'vertical';

const isSplit = (vue: any): vue is { i: Split } => {
  return vue.$options.name === 'Split';
};

interface Opts {
  name: Ref<string>;
  direction?: Direction;
  minSize: Ref<number>;
  maxSize: Ref<number>;
  collapsePixels: Ref<number>;
  parent: Split | null;
  height: Ref<number>;
  width: Ref<number>;
  initial: Ref<number | undefined>;
  collapsible: Ref<boolean>;
  fixed: Ref<boolean>;
  keep: Ref<boolean>;
}

class Split {
  public gutter = false;

  private height: Ref<number>;
  private width: Ref<number>;

  private level = 0;
  private before: Split[] = []; // Splits before gutter (left / top)
  private after: Split[] = []; // Splits after gutter (right / bottom)
  private fixed: Ref<boolean>;
  private keep: Ref<boolean>;

  private children: Split[] = [];
  private name: Ref<string>;
  private parent: Split | null;
  private direction?: Direction;
  private minSize: Ref<number>;
  private maxSize: Ref<number>;
  private collapsePixels: Ref<number>;
  private collapsible: Ref<boolean>;
  private initial: Ref<number | undefined>;
  private sizeForEvent = ref(0);
  private boundOnResizeEvent: () => void;

  constructor(opts: Opts) {
    this.direction = opts.direction;
    this.parent = opts.parent;
    this.height = opts.height;
    this.width = opts.width;
    this.minSize = opts.minSize;
    this.maxSize = opts.maxSize;
    this.collapsePixels = opts.collapsePixels;
    this.collapsible = opts.collapsible;
    this.initial = opts.initial;
    this.fixed = opts.fixed;
    this.keep = opts.keep;
    this.name = opts.name;
    this.boundOnResizeEvent = this.onResizeEvent.bind(this);
  }

  get isRoot() {
    return this.parent === null;
  }

  get parentDirection() {
    if (this.parent) {
      return this.parent.direction;
    }
  }

  get size() {
    if (!this.parent) {
      return -1;
    }

    if (this.parent.direction === 'horizontal') {
      return this.width.value;
    } else {
      return this.height.value;
    }
  }

  public onDidHeightResize(cb: (height: number) => void) {
    return watch(this.height, cb);
  }

  public onDidWidthResize(cb: (width: number) => void) {
    return watch(this.width, cb);
  }

  public onDidChangeSize(cb: (size: number) => void) {
    return watch(this.sizeForEvent, cb, { lazy: true });
  }

  public setParent(parent: Split) {
    this.parent = parent;
    this.parent.children.push(this);
    this.level = this.parent.level + 1;
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

  public init(sizes: { height: number, width: number }) {
    // tslint:disable-next-line:no-console
    console.log(`[${this.name.value}] Initializing at level => ${this.level}`);

    this.height.value = sizes.height;
    this.width.value = sizes.width;

    // There will never be a gutter for the first element
    this.children.slice(1).forEach((_, i) => {
      this.children[i + 1].gutter = !this.children[i].fixed.value && !this.children[i + 1].fixed.value;
    });

    this.children.map((child, i) => {
      child.before = this.children.slice(0, i).reverse();
      // After includes $children[i].
      // This makes sense if you think about it since the gutter is on the left/top of the element!
      child.after = this.children.slice(i);
    });

    if (this.isRoot) {
      window.addEventListener('resize', this.boundOnResizeEvent);
    }

    const initialSum = this.children.reduce((sum, curr) => sum + (curr.initial.value || 0), 0);
    const total = this.direction === 'horizontal' ? this.width.value : this.height.value;
    const remaining = total - initialSum;
    const notInitialized = this.children.filter((child) => child.initial.value === undefined);
    const size = remaining / notInitialized.length;

    this.children.forEach((split) => {
      const splitSize = split.initial.value !== undefined ? split.initial.value : size;

      // Set the opposite values
      // e.g. if the direction is "horizontal" set the height
      if (this.direction === 'horizontal') {
        split.init({
          height: this.height.value,
          width: splitSize,
        });
      } else {
        split.init({
          height: splitSize,
          width: this.width.value,
        });
      }
    });
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

  public dispose() {
    if (!this.isRoot) { return; }
    window.removeEventListener('resize', this.boundOnResizeEvent);
  }

  private onResizeEvent() {
    this.calculatePositions([this], window.innerWidth - this.width.value, 'horizontal');
    this.calculatePositions([this], window.innerHeight - this.height.value, 'vertical');
  }

  private doResize(
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
          s[attr].value = value;
        } else {
          if (s.parent!.direction === 'horizontal') {
            s.width.value = value;
          } else {
            s.height.value = value;
          }

          this.sizeForEvent.value = value;
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
        if (split.fixed.value) {
          continue;
        }

        // If we aren't considering keep, skip the splits with `keep` flag
        if (split.keep.value && !keep) {
          continue;
        }

        // Trim the new size at the max and min. If collapsed, make sure that newSize stays at 0 until
        // we reach the min size of the split.
        let newSize = Math.max(split.minSize.value, Math.min(split.size + px, split.maxSize.value));
        if (split.collapsed && px < split.minSize.value) {
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
        if (split.collapsible.value && collapsible && newSize === split.size && px < -this.collapsePixels.value) {
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
          const newSize = split.width.value + px;
          set(split, newSize, 'width');
        } else {
          const newSize = split.height.value + px;
          set(split, newSize, 'height');
        }
      }
      // This is definitely a bug
      // It won't appear until later though with embedded splits
      px = 0;
    }

    return px;
  }

  private get collapsed() {
    return this.size < this.minSize.value;
  }

  private get childrenReversed() {
    return this.children.slice().reverse();
  }
}

export default createComponent({
  name: 'Split',
  props: {
    /**
     * Irrelevant for leaf nodes.
     */
    direction: String as () => Direction,
    initial: Number,


    /**
     * Useful for debugging.
     */
    name: { type: String, required: true },

    /**
     * Irrelevant for root nodes.
     */
    keep: { type: Boolean, default: false },

    /**
     * Irrelevant for root nodes.
     */
    fixed: { type: Boolean, default: false },
    collapsible: { type: Boolean, default: false },
    minSize: { type: Number, default: 10 },
    maxSize: { type: Number, default: Infinity },
    gutterSize: { type: Number, default: 6 },
    collapsePixels: { type: Number, default: 10 },
  },
  setup(props, context) {
    const el = ref<HTMLElement>();

    const i = new Split({
      height: ref(0),
      width: ref(0),
      parent: null,
      direction: props.direction,
      minSize: ref(props.minSize),
      maxSize: ref(props.maxSize),
      collapsePixels: ref(props.collapsePixels),
      collapsible: ref(props.collapsible),
      keep: ref(props.keep),
      fixed: ref(props.fixed),
      initial: ref(props.initial),
      name: ref(props.name),
    });

    const gutterStyle = computed(() => {
      // The margin makes sure the gutter is centered on the line
      if (i.parentDirection === 'horizontal') {
        return {
          height: '100%',
          width: `${props.gutterSize}px`,
          marginLeft: `${-props.gutterSize / 2}px`,
        };
      } else {
        return {
          width: '100%',
          height: `${props.gutterSize}px`,
          marginTop: `${-props.gutterSize / 2}px`,
        };
      }
    });

    const cursor = computed(() => {
      if (i.parentDirection === 'horizontal') {
        return 'ew-resize';
      } else {
        return 'ns-resize';
      }
    });

    if (isSplit(context.parent)) {
      i.setParent(context.parent.i);
    }

    onMounted(() => {
      i.onDidHeightResize((height) => {
        if (el.value) {
          el.value.style.height = height + 'px';
        }
      });

      i.onDidWidthResize((width) => {
        if (el.value) {
          el.value.style.width = width + 'px';
        }
      });

      i.onDidChangeSize((size) => {
        update(props, context, 'initial', size);
      });

      if (!i.isRoot) { return; }

      i.init({
        height: window.innerHeight,
        width: window.innerWidth,
      });
    });

    onUnmounted(() => {
      i.dispose();
    });

    function move(e: MouseEvent) {
      if (i.parentDirection === undefined) {
        return;
      }

      if (!el.value) {
        return;
      }

      const { left, top } = el.value.getBoundingClientRect();
      const gutterPosition = i.parentDirection === 'horizontal' ? left : top;
      const mousePosition = i.parentDirection === 'horizontal' ? e.clientX : e.clientY;

      const px = mousePosition - gutterPosition;
      i.resize(px);
    }

    return {
      el,
      move,
      cursor,
      gutterStyle,
      i,
    };
  },
});
</script>

<style lang="scss" scoped>
.gutter {
  left: 0;
  top: 0;
  width: 100%;
  z-index: 999;
}
</style>
