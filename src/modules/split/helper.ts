import { watch, Ref, ref } from '@vue/composition-api';

export type Direction = 'horizontal' | 'vertical';

export const isSplit = (vue: any): vue is { i: Split } => {
  return vue.$options.name === 'Split';
};

type Mode = 'high-priority' | 'low-priority' | 'collapsible';

interface Opts {
  name: Ref<string>;
  direction?: Direction;
  minSize: Ref<number>;
  maxSize: Ref<number>;
  collapsePixels: Ref<number>;
  initial: Ref<number | undefined>;
  collapsible: Ref<boolean>;
  fixed: Ref<boolean>;
  keep: Ref<boolean>;
}

export class Split {
  public gutter = false;

  private height = ref(0);
  private width = ref(0);

  private level = 0;
  private before: Split[] = []; // Splits before gutter (left / top)
  private after: Split[] = []; // Splits after gutter (right / bottom)
  private fixed: Ref<boolean>;
  private keep: Ref<boolean>;

  private children: Split[] = [];
  private name: Ref<string>;
  private parent: Split | null = null;
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

  get sizes() {
    return {
      height: this.height.value,
      width: this.width.value,
    };
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

  public init(sizes: { height: number, width: number }) {
    // tslint:disable-next-line:no-console
    // console.log(`[${this.name.value}] Initializing at level => ${this.level}`);

    this.height.value = sizes.height;
    this.width.value = sizes.width;

    // There will never be a gutter for the first element
    // This logic may not be right but we are putting a gutter on any divider that doesn't touch a "fixed" split
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

  /**
   * Resize by "px" pixels.
   *
   * If "px" is positive, the "after" splis will shrink and the "before" will grow.
   * If "px" is negative, the opposite will happen.
   */
  public resize(px: number) {
    if (!this.parent) {
      return;
    }

    if (!this.parent.direction) {
      return;
    }

    if (px === 0) { return; }

    /**
     * Min that ignores signs and returns a value with the same sign as "px" when called.
     */
    const min = (...args: number[]) => {
      return Math.min(...args.map(Math.abs)) * Math.sign(px);
    };

    /**
     * Max ignoring signs.
     */
    const max = (...args: number[]) => {
      let index = 0;
      args.forEach((value, i) => {
        if (Math.abs(value) > Math.abs(args[index])) {
          index = i;
        }
      });

      return args[index];
    };

    // console.log('STATING');


    // OK do first round of dry runs
    // Check how much we can move in each direction using "px"
    // "option1" and "option2" two can be bigger than "px" due to the collapsing functionality
    const disposer1 = this.parent.startDryRun();
    const option1 = this.doResize(this.before, { px, direction: this.parent.direction });

    const option2 = this.doResize(this.after, { px: -px, direction: this.parent.direction });
    disposer1.dispose();

    // Because "option1" and "option2" can be bigger, we need to do two more dry runs with the new values
    // e.g. px = -11, option1 = -100 due to collapsing
    // At this point, we check to make sure that other side can support 100px movement
    // BTW there is probably a bug with this logic honestly but it works for my use cases
    // e.g. if one side collapses but the other side can only support part of the movement
    // In this case, the side wouldn't collapse but the other side would still move the amount it supports
    const disposer2 = this.parent.startDryRun();
    const option3 = this.doResize(this.before, { px: -option2, direction: this.parent.direction });
    const option4 = this.doResize(this.after, { px: -option1, direction: this.parent.direction });
    disposer2.dispose();

    px = min(
      max(
        option1,
        option3,
      ),
      max(
        option2,
        option4,
      ),
    );

    // console.log(
    //   this.parent.direction,
    //   px,
    //   option1,
    //   option3,
    //   option2,
    //   option4,
    // );

    // The actual pixels moved (they might be different if something collapsed)
    this.doResize(this.before, { px, direction: this.parent.direction });
    this.doResize(this.after, { px: -px, direction: this.parent.direction });
  }

  public collapse() {
    if (!this.collapsible.value) {
      return;
    }

    if (!this.parent || !this.parent.direction) {
      return;
    }

    const direction = this.parent.direction;

    const doResize = () => {
      let after;
      let before;

      if (this.before.length === 0) {
        before = this.doResizePass(this.before.slice(0, 1), -this.size, direction, 'collapsible');
        after = this.size - this.doResize(this.after.slice(1), { px: this.size, direction });
      } else {
        before = this.size - this.doResize(this.before, { px: this.size, direction });
        after = this.doResizePass(this.after, -this.size, direction, 'collapsible');
      }

      return {
        after,
        before,
      };
    };

    const disposer = this.parent.startDryRun();
    const pxMoved = doResize();
    disposer.dispose();

    if (pxMoved.after !== 0 || pxMoved.before !== 0) {
      return;
    }

    doResize();
  }

  public dispose() {
    window.removeEventListener('resize', this.boundOnResizeEvent);
  }

  /**
   * Resize the splits taking into account which splits should be resized first and which are collapsible.
   *
   * @param splits The splits.
   * @param px The amount of pixels to move. Either negative or positive.
   * @param direction The direction to move.
   * @returns The amount of pixels it actually moved.
   */
  private doResize(
    splits: Split[],
    { px, direction }: { px: number, direction: Direction },
  ) {
    // console.log('Considering ' + splits.length + ' splits moving ' + px);

    // First resize but don't include children that have keep flag
    let pxRemaining = this.doResizePass(splits, px, direction, 'high-priority');
    // console.log('After first pass: ' + pxRemaining);

    // Then resize again but include the children with a keep flag
    pxRemaining = this.doResizePass(splits, pxRemaining, direction, 'low-priority');
    // console.log('After second pass: ' + pxRemaining);

    // Then resize anything that is collapsible
    pxRemaining = this.doResizePass(splits, pxRemaining, direction, 'collapsible');
    // console.log('After third pass: ' + pxRemaining);

    // Then calculate how many pixels we actually moved.
    return px - pxRemaining;
  }

  private onResizeEvent() {
    this.doResize([this], { px: window.innerWidth - this.width.value, direction: 'horizontal' });
    this.doResize([this], { px: window.innerHeight - this.height.value, direction: 'vertical' });
  }

  private doResizePass(
    splits: Split[],
    px: number,
    direction: Direction,
    mode: Mode,
  ) {
    if (splits.length === 0) { return px; }
    const parent = splits[0].parent; // all children have the same parent

    // Just a helper method
    const set = (s: Split, value: number, attr?: 'height' | 'width') => {
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
    };

    if (parent && parent.direction === direction) {
      for (const split of splits) {
        // We're done if px === 0
        if (px === 0) {
          break;
        }

        // Skip he fixed splits.
        if (split.fixed.value) {
          continue;
        }

        // If we aren't considering high priority, skip the splits with the `keep` flag
        if (split.keep.value && mode === 'high-priority') {
          continue;
        }

        // If we are considering low priority, skip the splits without the `keep` flag
        if (!split.keep.value && mode === 'low-priority') {
          continue;
        }

        // Trim the new size at the max and min. If collapsed, make sure that newSize stays at 0 until
        // we reach the min size of the split.
        let newSize = split.size;
        if (mode === 'high-priority' || mode === 'low-priority') {
          newSize = Math.max(split.minSize.value, Math.min(split.size + px, split.maxSize.value));
        }

        if (split.collapsed && px < split.minSize.value) {
          newSize = 0;
        }

        // Check if we want to collapse
        // There is a bit of weird logic going on
        // Basically if:
        // 1. The split is actually collapsible
        // 2. We are considering collapsible stuff
        // 3. The new size is the current size
        // 4. We've moved more than the amount of collapse pixels. This acts as a buffer.
        if (
          split.collapsible.value &&
          mode === 'collapsible' &&
          newSize === split.size &&
          px < -this.collapsePixels.value
        ) {
          newSize = 0;
        }

        const diff = newSize - split.size;
        this.doResizePass(split.childrenReversed, diff, direction, mode);
        set(split, newSize);

        px -= diff;
      }
    } else {
      for (const split of splits) {
        this.doResizePass(split.childrenReversed, px, direction, mode);
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

  private startDryRun() {
    const height = this.height.value;
    const width = this.width.value;

    const disposers = this.children.map((child) => child.startDryRun());

    return {
      dispose: () => {
        this.height.value = height;
        this.width.value = width;
        disposers.forEach(({ dispose }) => dispose());
      },
    };
  }

  private get collapsed() {
    return this.size < this.minSize.value;
  }

  private get childrenReversed() {
    return this.children.slice().reverse();
  }
}
