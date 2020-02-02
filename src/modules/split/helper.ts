import { watch, Ref, ref } from '@vue/composition-api';
import { StrictEventEmitter } from '@/events';

export type Direction = 'horizontal' | 'vertical';

export const isSplit = (vue: any): vue is { i: Split } => {
  return vue.$options.name === 'Split';
};

type Mode = 'high-priority' | 'low-priority' | 'collapsible';
type Mouvement = {
  type: 'smooth',
  amount: number,
  execute: (amount: number) => void,
} | { type: 'jump', amount: number, execute: (amount: number) => void };

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

// tslint:disable-next-line:interface-over-type-literal
type SplitEvents = {
  heightResize: [number];
  widthResize: [number];
  resize: [number];
};

export class Split extends StrictEventEmitter<SplitEvents> {
  public readonly direction?: Direction;
  private gutter = false;

  private height = 0;
  private width = 0;

  private level = 0;
  private before: Split[] = []; // Splits before gutter (left / top)
  private after: Split[] = []; // Splits after gutter (right / bottom)
  private fixed: Ref<boolean>;
  private keep: Ref<boolean>;

  private children: Split[] = [];
  private name: Ref<string>;
  // tslint:disable-next-line:variable-name
  private _parent: Split | null = null;
  private minSize: Ref<number>;
  private maxSize: Ref<number>;
  private collapsePixels: Ref<number>;
  private collapsible: Ref<boolean>;
  private initial: Ref<number | undefined>;
  private boundOnResizeEvent: () => void;

  constructor(opts: Opts) {
    super();
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

  get parent() {
    return this._parent;
  }

  get isGutter() {
    return this.gutter;
  }

  get sizes() {
    return {
      height: this.height,
      width: this.width,
    };
  }

  private get isRoot() {
    return this.parent === null;
  }

  private get size() {
    if (!this.parent) {
      return -1;
    }

    if (this.parent.direction === 'horizontal') {
      return this.width;
    } else {
      return this.height;
    }
  }

  // public onDidHeightResize(cb: (height: number) => void) {
  //   return watch(this.height, cb);
  // }

  // public onDidWidthResize(cb: (width: number) => void) {
  //   return watch(this.width, cb);
  // }

  // public onDidChangeSize(cb: (size: number) => void) {
  //   return watch(this.sizeForEvent, cb, { lazy: true });
  // }

  public setParent(parent: Split) {
    this._parent = parent;
    parent.children.push(this);
    this.level = parent.level + 1;
  }

  public init(sizes: { height: number, width: number }) {
    // tslint:disable-next-line:no-console
    // console.log(`[${this.name.value}] Initializing at level => ${this.level}`);

    this.height = sizes.height;
    this.width = sizes.width;

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
    const total = this.direction === 'horizontal' ? this.width : this.height;
    const remaining = total - initialSum;
    const notInitialized = this.children.filter((child) => child.initial.value === undefined);
    const size = remaining / notInitialized.length;

    this.children.forEach((split) => {
      const splitSize = split.initial.value !== undefined ? split.initial.value : size;

      // Set the opposite values
      // e.g. if the direction is "horizontal" set the height
      if (this.direction === 'horizontal') {
        split.init({
          height: this.height,
          width: splitSize,
        });
      } else {
        split.init({
          height: splitSize,
          width: this.width,
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

    console.log(option1, '\n', option2);

    const mouvements1 = option1.mouvements.map((o) => ({ ...o, amount: Math.abs(o.amount) }));
    const mouvements2 = option2.mouvements.map((o) => ({ ...o, amount: Math.abs(o.amount) }));

    const breakUp = (mouvements: Mouvement[]) => {
      return {
        smooth: mouvements.filter((m) => m.type === 'smooth'),
        jumps: mouvements.filter((m) => m.type === 'jump'),
      };
    };

    const { jumps: jumps1, smooth: smooth1 } = breakUp(mouvements1);
    const { jumps: jumps2, smooth: smooth2 } = breakUp(mouvements2);

    const sumSmooth = (mouvements: Mouvement[]) => {
      return Math.abs(mouvements.reduce((sum, m) => m.amount + sum, 0));
    };

    let sumSmooth1 = sumSmooth(smooth1);
    let sumSmooth2 = sumSmooth(smooth2);

    let toMove1 = Math.min(sumSmooth1, sumSmooth2);
    let toMove2 = toMove1;
    console.log(`\nBefore Smooth: ${sumSmooth1}\nAfter Smooth: ${sumSmooth2}\nMoving: ${toMove1}\n`);

    let i2 = 0;
    for (const m of mouvements2) {
      if (m.amount > toMove1) {
        break;
      }

      m.execute(m.amount);
      toMove1 -= m.amount;
      sumSmooth1 -= m.amount;
      i2++;
    }

    let i1 = 0;
    for (const m of mouvements1) {
      if (m.amount > toMove2) {
        break;
      }

      m.execute(m.amount);
      toMove2 -= m.amount;
      sumSmooth2 -= m.amount;
      i1++;
    }

    if (sumSmooth1 !== 0) {
      let moved = 0;
      // The rest will all be "jump"
      for (const m of jumps2) {
        if (m.amount > sumSmooth1) {
          break;
        }

        m.execute(m.amount);
        moved += m.amount;
        sumSmooth1 -= m.amount;
        i2++;
      }

      for (const m of mouvements1.splice(i1)) {
        if (moved === 0) {
          return;
        }

        const toMove = Math.min(m.amount, moved);
        m.execute(m.amount);
        moved -= toMove;
        i1++;
      }
    }

    if (sumSmooth2 !== 0) {
      let moved = 0;
      // The rest will all be "jump"
      for (const m of jumps1) {
        if (m.amount > sumSmooth2) {
          break;
        }

        m.execute(m.amount);
        moved += m.amount;
        sumSmooth2 -= m.amount;
      }

      for (const m of mouvements2.splice(i2)) {
        if (moved === 0) {
          return;
        }

        const toMove = Math.min(m.amount, moved);
        m.execute(m.amount);
        moved -= toMove;
        i2++;
      }
    }

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
      let after: number;
      let before: number;

      if (this.before.length === 0) {
        before = this.doResizePass(this.before.slice(0, 1), -this.size, direction, 'collapsible').remaining;
        after = this.size - this.doResize(this.after.slice(1), { px: this.size, direction }).amount;
      } else {
        before = this.size - this.doResize(this.before, { px: this.size, direction }).amount;
        after = this.doResizePass(this.after, -this.size, direction, 'collapsible').remaining;
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

  public unCollapse() {
    //
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

    const mouvements: Mouvement[] = [];

    // First resize but don't include children that have keep flag
    let result = this.doResizePass(splits, px, direction, 'high-priority');
    mouvements.push(...result.mouvements);

    // Then resize again but include the children with a keep flag
    result = this.doResizePass(splits, result.remaining, direction, 'low-priority');
    mouvements.push(...result.mouvements);

    // Then resize anything that is collapsible
    result = this.doResizePass(splits, result.remaining, direction, 'collapsible');
    mouvements.push(...result.mouvements);

    // Then calculate how many pixels we actually moved.
    return {
      amount: px - result.remaining,
      mouvements,
    };
  }

  private onResizeEvent() {
    this.doResize([this], { px: window.innerWidth - this.width, direction: 'horizontal' });
    this.doResize([this], { px: window.innerHeight - this.height, direction: 'vertical' });
  }

  private doResizePass(
    splits: Split[],
    px: number,
    direction: Direction,
    mode: Mode,
  ): { remaining: number, mouvements: Mouvement[] } {
    if (splits.length === 0 || px === 0) {
      return { remaining: px, mouvements: [] };
    }
    const parent = splits[0].parent; // all children have the same parent

    // Just a helper method
    const set = (s: Split, value: number, attr?: 'height' | 'width') => {
      if (attr) {
        s[attr] = value;

        if (attr === 'height') {
          s.height = value;
          s.emit('heightResize', value);
        } else {
          s.width = value;
          s.emit('widthResize', value);
        }

      } else {
        if (s.parent!.direction === 'horizontal') {
          s.width = value;
          s.emit('widthResize', value);
        } else {
          s.height = value;
          s.emit('heightResize', value);
        }

        // TODO if we are in a dry run then???
        s.emit('resize', value);
      }
    };

    if (!parent || parent.direction !== direction) {
      for (const split of splits) {
        this.doResizePass(split.childrenReversed, px, direction, mode);
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
      return {
        remaining: 0,
        mouvements: [],
      };
    }

    const originalSign = Math.sign(px) as 1 | -1;
    const changedSignOrZero = (value: number) => {
      return value === 0 || Math.sign(value) !== originalSign;
    };

    let getMouvement: (split: Split) => any | undefined; // TODO any
    if (mode === 'collapsible') {
      getMouvement = (split) => {
        // We want to collapse IFF:
        // 1. The split is actually collapsible
        // 2. We are considering collapsible stuff
        // 3. We've moved more than the amount of collapse pixels. This acts as a buffer.
        if (
          !split.collapsed &&
          split.collapsible.value &&
          px < -this.collapsePixels.value
        ) {
          return { type: 'jump', amount: -split.size };
        }
      };
    } else {
      getMouvement = (split) => {
        // If we aren't considering high priority, skip the splits with the `keep` flag
        if (split.keep.value && mode === 'high-priority') {
          return;
        }

        // If we are considering low priority, skip the splits without the `keep` flag
        if (!split.keep.value && mode === 'low-priority') {
          return;
        }

        const newSize = Math.max(split.minSize.value, Math.min(split.size + px, split.maxSize.value));
        if (newSize !== split.size) {
          return { type: 'smooth', amount: newSize - split.size };
        }
      };
    }

    const mouvements: Mouvement[] = [];
    for (const split of splits) {
      // We're done if px === 0
      if (changedSignOrZero(px)) {
        break;
      }

      // Skip he fixed splits.
      if (split.fixed.value) {
        continue;
      }

      const mouvement = getMouvement(split);
      if (!mouvement) {
        continue;
      }

      const diff = mouvement.amount;
      this.doResizePass(split.childrenReversed, diff, direction, mode);
      px -= diff;

      mouvements.push({
        ...mouvement,
        execute: (amount) => {
          amount = Math.sign(diff) * Math.abs(amount);
          set(split, split.size + amount);
        },
      });
    }

    return {
      remaining: px,
      mouvements,
    };
  }

  private startDryRun() {
    const height = this.height;
    const width = this.width;

    const disposers = this.children.map((child) => child.startDryRun());

    return {
      dispose: () => {
        this.height = height;
        this.width = width;
        disposers.forEach(({ dispose }) => dispose());
      },
    };
  }

  private get collapsed() {
    return this.size < this.minSize.value && this.size === 0;
  }

  private get childrenReversed() {
    return this.children.slice().reverse();
  }
}
