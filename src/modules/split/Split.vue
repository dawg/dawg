<template>
  <div class="relative" :class="{ flex: direction, 'flex-col': direction === 'vertical' }">
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
import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
import { watch, Ref, ref } from '@vue/composition-api';

export type Direction = 'horizontal' | 'vertical';

const isSplit = (vue: Vue): vue is Split => {
  return (vue.constructor as any as { options: { name: string } }).options.name === Split.name;
};

interface Opts {
  direction?: Direction;
  minSize: Ref<number>;
  maxSize: Ref<number>;
  collapsePixels: Ref<number>;
  parent: Instance | null;
  height: Ref<number>;
  width: Ref<number>;
  initial: Ref<number>;
  collapsible: Ref<boolean>;
  fixed: Ref<boolean>;
  keep: Ref<boolean>;
}

class Instance {
  public height: Ref<number>;
  public width: Ref<number>;

  // We set some of the defaults here so we can view them in vue-devtools
  // If no defaults are set, we do not see them...
  public gutter = false;
  public level = 0;

  public children: Instance[] = [];
  public before: Instance[] = []; // Splits before gutter (left / top)
  public after: Instance[] = []; // Splits after gutter (right / bottom)
  public fixed: Ref<boolean>;
  public keep: Ref<boolean>;

  private parent: Instance | null;
  private direction?: Direction;
  private minSize: Ref<number>;
  private maxSize: Ref<number>;
  private collapsePixels: Ref<number>;
  private collapsible: Ref<boolean>;
  private initial: Ref<number>;

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
    return watch(this.initial, cb);
  }

  public setParent(parent: Instance) {
    this.parent = parent;
    this.parent.children.push(this);
  }

  /**
   * Resize the splits taking into account which splits should be resized first and which are collapsible.
   *
   * @param splits The splits.
   * @param px The amount of pixels to move. Either negative or positive.
   * @param direction The direction to move.
   * @returns The amount of pixels it actually moved.
   */
  public calculatePositions(splits: Instance[], px: number, direction: Direction, dryRun = false) {
    // First resize but don't include children that have keep flag
    // Then resize again but include the children with a keep flag
    // Then resize anything that is collapsible
    let pxRemaining = this.doResize(splits, px, direction, { dryRun });
    pxRemaining = this.doResize(splits, pxRemaining, direction, { keep: true, dryRun });
    pxRemaining = this.doResize(splits, pxRemaining, direction, { collapsible: true, dryRun });
    return px - pxRemaining;
  }

  public init() {
    console.log('Initializing node at level ' + this.level);

    if (!this.direction) { return; }

    if (!this.parent && this.collapsible.value) {
      throw Error('The parent cannot be collapsible');
    }

    let remaining = this.direction === 'horizontal' ? this.width.value : this.height.value;
    this.children.forEach((split, i) => {
      if (this.direction === 'horizontal') {
        split.height.value = this.height.value;
      } else {
        split.width.value = this.width.value;
      }

      if (split.initial.value) {
        split.setSize(split.initial.value);
        remaining -= split.initial.value;
      }
    });

    const notInitialized = this.children.filter((child) => !child.initial.value);
    const size = remaining / notInitialized.length;
    notInitialized.forEach((split) => { split.setSize(size); });
    this.children.forEach((split) => { split.init(); });
  }

  public setSize(size: number) {
    if (this.parent!.direction === 'horizontal') {
      this.width.value = size;
    } else {
      this.height.value = size;
    }
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

  private doResize(
    splits: Instance[],
    px: number,
    direction: Direction,
    opts?: { keep?: boolean, collapsible?: boolean, dryRun?: boolean },
  ) {
    const { keep = false, collapsible = false, dryRun = false } = opts || {};
    if (splits.length === 0) { return px; }
    const child = splits[0]; // all children have the same parent

    // Just a helper method
    const set = (s: Instance, value: number, attr?: 'height' | 'width') => {
      if (!dryRun) {
        if (attr) {
          s[attr].value = value;
        } else {
          s.setSize(value);
          this.initial.value = value;
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

  public toDispose: Array<() => void> = [];

  public $el!: HTMLElement;

  public i = new Instance({
    height: ref(0),
    width: ref(0),
    parent: null,
    direction: this.direction,
    minSize: ref(this.minSize),
    maxSize: ref(this.maxSize),
    collapsePixels: ref(this.collapsePixels),
    collapsible: ref(this.collapsible),
    keep: ref(this.keep),
    fixed: ref(this.fixed),
    initial: ref(this.initial),
  });

  get gutterStyle() {
    // The margin makes sure the gutter is centered on the line
    if (this.i.parentDirection === 'horizontal') {
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

  get cursor() {
    if (this.i.parentDirection === 'horizontal') {
      return 'ew-resize';
    } else {
      return 'ns-resize';
    }
  }

  public mounted() {
    this.toDispose.push(this.i.onDidHeightResize((height) => {
      this.$el.style.height = height + 'px';
    }));

    this.toDispose.push(this.i.onDidWidthResize((width) => {
      this.$el.style.width = width + 'px';
    }));

    this.toDispose.push(this.i.onDidChangeSize((size) => {
      this.$update('initial', size);
    }));

    if (isSplit(this.$parent)) {
      this.i.setParent(this.$parent.i);
    }

    const getLevel = (node: Vue): number => {
      if (isSplit(node)) {
        return getLevel(node.$parent) + 1;
      } else {
        return 0;
      }
    };

    this.i.level = getLevel(this);
    console.log('Mounted node at level ' + this.i.level);

    this.i.children.map((child, i) => {
      child.before = this.i.children.slice(0, i).reverse();
      // After includes $children[i].
      // This makes sense if you think about it since the gutter is on the left/top of the element!
      child.after = this.i.children.slice(i);
    });

    // There will never be a gutter for the first element
    this.i.children.slice(1).forEach((_, i) => {
      this.i.children[i + 1].gutter = !this.i.children[i].fixed.value && !this.i.children[i + 1].fixed.value;
    });

    if (!this.i.isRoot) { return; }
    this.i.height.value = window.innerHeight;
    this.i.width.value = window.innerWidth;

    window.addEventListener('resize', this.onResizeEvent);
    this.i.init();
  }

  public destroyed() {
    this.toDispose.forEach((cb) => cb());
    if (!this.i.isRoot) { return; }
    window.removeEventListener('resize', this.onResizeEvent);
  }

  public onResizeEvent() {
    this.i.calculatePositions([this.i], window.innerWidth - this.i.width.value, 'horizontal');
    this.i.calculatePositions([this.i], window.innerHeight - this.i.height.value, 'vertical');
  }

  public move(e: MouseEvent) {
    if (this.i.parentDirection === undefined) {
      return;
    }

    const { left, top } = this.$el.getBoundingClientRect();
    const gutterPosition = this.i.parentDirection === 'horizontal' ? left : top;
    const mousePosition = this.i.parentDirection === 'horizontal' ? e.clientX : e.clientY;

    const px = mousePosition - gutterPosition;
    this.i.resize(px);
  }
}
</script>

<style lang="scss" scoped>
.gutter {
  left: 0;
  top: 0;
  width: 100%;
  z-index: 999;
}
</style>
