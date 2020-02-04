import { ref, watch } from '@vue/composition-api';
import { StrictEventEmitter } from '@/events';
import { addEventListener } from '@/utils';

type LinkedList<T> = { done: true } | { done: false, value: T, next: () => LinkedList<T>, added: boolean };
const getLinkedList = <T>(arr: T[]): LinkedList<T> => {
  const iter = arr[Symbol.iterator]() as { next: () => { done: true } | { done: false, value: T  } };

  const getNext = () => {
    const current = iter.next();
    if (current.done) {
      return current;
    }

    return {
      done: false,
      value: current.value,
      next: getNext,
      added: false,
    };
  };

  return getNext();
};


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
  name: string;
  direction?: Direction;
  minSize: number;
  maxSize: number;
  collapsePixels: number;
  initial: number | undefined;
  collapsible: boolean;
  fixed: boolean;
  keep: boolean;
  collapsed: boolean;
}

// tslint:disable-next-line:interface-over-type-literal
type SplitEvents = {
  heightResize: [number];
  widthResize: [number];
  resize: [number];
  collapsed: [boolean];
};

type SectionMode = 'low' | 'high' | 'fixed';
interface SectionOpts {
  name: string;
  collapsible?: boolean;
  minSize?: number;
  collapsePixels?: number;
}

export class Section {
  private disabled = false;
  private width = ref(0);
  private height = ref(0);
  private minSize: number;
  private direction: Direction | undefined;
  private parent: null | Section = null;
  private children: Section[] = [];
  private toDispose: Array<{ dispose: () => void }> = [];
  private mode: SectionMode = 'low';
  private collapsible = false;
  private collapsed = false;
  private collapsePixels = 10;
  private name: string;

  constructor(o: SectionOpts) {
    this.minSize = o.minSize || 15;
    this.collapsible = !!o.collapsible;
    this.name = o.name;
    this.collapsePixels = o.collapsePixels || 10;
  }

  public setParent(parent: Section) {
    this.parent = parent;
    parent.children.push(this);
  }

  public siblings() {
    if (!this.parent) {
      return {
        before: [],
        after: [],
      };
    }

    const i = this.parent.children.indexOf(this);
    const before = this.parent.children.slice(0, i).reverse();
    const after = this.parent.children.slice(i);
    if (i === -1) {
      return {
        before: [],
        after: [],
      };
    }

    return {
      before,
      after,
    };
  }

  public move(px: number) {
    if (!this.parent || !this.parent.direction || px === 0) {
      return;
    }

    const i = this.parent.children.indexOf(this);
    if (i === -1) {
      return;
    }

    const attr = this.parent.direction === 'horizontal' ? 'width' : 'height' as const;
    const { before, after } = this.siblings();
    let shrinking: Section[];
    let growing: Section[];

    if (px < 0) {
      shrinking = before;
      growing = after;
    } else {
      shrinking = after;
      growing = before;
    }

    const move = (sections: Section[], toMove: number) => {
      let totalMoved = 0;
      totalMoved += this.iterate(sections, attr, toMove, 'high');
      totalMoved += this.iterate(sections, attr, toMove - totalMoved, 'low');
      totalMoved += this.iterate(sections, attr, toMove - totalMoved, 'collapse');
      return totalMoved;
    };

    px = move(shrinking, px);
    move(growing, px);
  }

  public collapse() {
    this.collapseHelper('collapse');
  }

  public unCollapse() {
    this.collapseHelper('un-collapse');
  }

  public init() {
    this.children.forEach((c) => c.init());

    this.toDispose.push({
      dispose: watch(this.height, () => {
        this.resize({ direction: 'horizontal' });
      }),
    });

    this.toDispose.push({
      dispose: watch(this.width, () => {
        this.resize({ direction: 'vertical' });
      }),
    });


    if (this.parent === null) {
      const setSize = () => {
        this.width.value = window.innerWidth;
        this.height.value = window.innerWidth;
      };


      this.toDispose.push(addEventListener('resize', setSize));
    }
  }

  public onDidSizeChange(cb: () => void) {
    if (!this.parent || !this.parent.direction) {
      return;
    }

    const actualCb = () => {
      if (!this.disabled) {
        cb();
      }
    };

    if (this.parent.direction === 'horizontal') {
      watch(this.height, actualCb);
    } else {
      watch(this.width, actualCb);
    }
  }

  public onDidHeightChange(cb: () => void) {
    watch(this.height, cb);
  }

  public onDidWidthChange(cb: () => void) {
    watch(this.width, cb);
  }

  public dispose() {
    this.toDispose.forEach(({ dispose }) => dispose());
    this.toDispose = [];
  }

  private collapseHelper(mode: 'collapse' | 'un-collapse') {
    if (this.collapsed || !this.parent) {
      return;
    }

    const { before, after } = this.siblings();
    if (before.length === 0 && after.length === 0) {
      return;
    }

    const attr = this.parent.direction === 'horizontal' ? 'width' : 'height' as const;
    const noBeforeMultiple = mode === 'collapse' ? -1 : 1;
    const hasBeforeMultiple = mode === 'un-collapse' ? -1 : 1;

    this.withDisabled(() => {
      const amount = Math.max(this[attr].value, this.minSize);
      if (before.length === 0) {
        const rightAfter = after[0];
        rightAfter.move(amount * noBeforeMultiple);
      } else {
        this.move(amount * hasBeforeMultiple);
      }
    });
  }

  private withDisabled(cb: () => void) {
    this.disabled = true;
    try {
      cb();
    } finally {
      this.disabled = false;
    }
  }

  private resize({ direction }: { direction: Direction }) {
    const attr = direction === 'horizontal' ? 'width' : 'height' as const;
    const oldSize = this.children.reduce((sum, child) => sum + child[attr].value, 0);
    let px = this[attr].value - oldSize;

    if (this.direction !== direction) {
      this.children.forEach((child) => {
        child[attr].value = this[attr].value + px;
      });
      return;
    }

    px -= this.iterate(this.children, attr, px, 'high');
    this.iterate(this.children, attr, px, 'low');
  }

  private iterate(sections: Section[], attr: 'height' | 'width', toMove: number, mode: 'low' | 'high' | 'collapse') {
    let moved = 0;
    for (const section of sections) {
      if ((mode === 'high' || mode === 'low') && mode !== section.mode || section.collapsed) {
        continue;
      }

      if (toMove === 0) {
        break;
      }

      let newSize = section[attr].value;

      if (mode === 'high' || mode === 'low') {
        newSize = Math.max(section.minSize, section[attr].value + toMove);
        if (newSize === section[attr].value) {
          continue;
        }
      } else {
        if (
          section.collapsible &&
          !section.collapsed &&
          toMove < -section.collapsePixels
        ) {
          section.collapsed = true;
          newSize = 0;
        } else if (
          section.collapsible &&
          section.collapsed &&
          toMove >= section.minSize
        ) {
          section.collapsed = false;
          newSize = section.minSize;
        } else {
          continue;
        }
      }

      console.log(
        `[${mode.padEnd(8)}, ${attr}] ${name} ` +
        `from ${section[attr].value.toString().padEnd(3)} -> ${newSize.toString().padEnd(3)}`,
      );

      const diff = newSize - section[attr].value;
      section[attr].value = newSize;
      toMove -= diff;
      moved += diff;
    }

    return moved;
  }
}

export class Split extends StrictEventEmitter<SplitEvents> {
  public readonly direction?: Direction;
  // must be ref for reactivity
  private readonly gutter = ref(false);
  private collapsed: boolean;

  // tslint:disable-next-line:variable-name
  private _height = 0;
  // tslint:disable-next-line:variable-name
  private _width = 0;

  private level = 0;
  private before: Split[] = []; // Splits before gutter (left / top)
  private after: Split[] = []; // Splits after gutter (right / bottom)
  private fixed: boolean;
  private keep: boolean;

  private children: Split[] = [];
  private name: string;
  // tslint:disable-next-line:variable-name
  private _parent: Split | null = null;
  private minSize: number;
  private maxSize: number;
  private collapsePixels: number;
  private collapsible: boolean;
  private initial: number | undefined;
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
    this.collapsed = opts.collapsed;
    this.boundOnResizeEvent = this.onResizeEvent.bind(this);
  }

  get parent() {
    return this._parent;
  }

  get isGutter() {
    return this.gutter.value;
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

  private get trueSize() {
    if (!this.parent) {
      return -1;
    }

    if (this.parent.direction === 'horizontal') {
      return this._width;
    } else {
      return this._height;
    }
  }

  private get height() {
    return this.collapsed ? 0 : this._height;
  }

  private set height(value: number) {
    this._height = value;
  }

  private get width() {
    return this.collapsed ? 0 : this._width;
  }

  private set width(value: number) {
    this._width = value;
  }

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
    this.emit('heightResize', sizes.height);
    this.emit('widthResize', sizes.width);

    // There will never be a gutter for the first element
    // This logic may not be right but we are putting a gutter on any divider that doesn't touch a "fixed" split
    this.children.slice(1).forEach((_, i) => {
      this.children[i + 1].gutter.value = !this.children[i].fixed && !this.children[i + 1].fixed;
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

    const initialSum = this.children.reduce((sum, curr) => sum + (curr.initial || 0), 0);
    const total = this.direction === 'horizontal' ? this.width : this.height;
    const remaining = total - initialSum;
    const notFixed = this.children.filter((child) => child.initial === undefined && child.collapsed === false);
    const size = remaining / notFixed.length;

    this.children.forEach((split) => {
      const splitSize = split.initial !== undefined ? split.initial : split.collapsed ? 0 : size;

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

    // OK do first round of dry runs
    // Check how much we can move in each direction using "px"
    // "option1" and "option2" two can be bigger than "px" due to the collapsing functionality
    let option1 = this.doResize(this.before, { px, direction: this.parent.direction });
    let option2 = this.doResize(this.after, { px: -px, direction: this.parent.direction });

    if (Math.abs(option1.amount) > Math.abs(px)) {
      option2 = this.doResize(this.after, { px: -option1.amount, direction: this.parent.direction });
    }

    if (Math.abs(option2.amount) > Math.abs(px)) {
      option1 = this.doResize(this.before, { px: -option2.amount, direction: this.parent.direction });
    }

    // // tslint:disable-next-line:no-console
    // console.log(JSON.stringify(option1, null, 2));
    // // tslint:disable-next-line:no-console
    // console.log(JSON.stringify(option2, null, 2));

    const breakUp = (mouvements: Mouvement[]) => {
      return {
        smooth: mouvements.filter((m) => m.type === 'smooth'),
        jumps: mouvements.filter((m) => m.type === 'jump'),
      };
    };

    const mouvements1 = option1.mouvements.map((o) => ({ ...o, amount: Math.abs(o.amount) }));
    const mouvements2 = option2.mouvements.map((o) => ({ ...o, amount: Math.abs(o.amount) }));
    const { jumps: jumps1, smooth: smooth1 } = breakUp(mouvements1);
    const { jumps: jumps2, smooth: smooth2 } = breakUp(mouvements2);

    const sumSmooth1 = Math.abs(smooth1.reduce((sum, m) => m.amount + sum, 0));
    const sumSmooth2 = Math.abs(smooth2.reduce((sum, m) => m.amount + sum, 0));
    const minSmooth = Math.min(sumSmooth1, sumSmooth2);

    const moveSmooth = ({ toMove, smooth }: { toMove: number, smooth: LinkedList<Mouvement> }) => {
      while (!smooth.done && toMove > 0) {
        const amount = Math.min(toMove, smooth.value.amount);
        smooth.value.execute(amount);
        toMove -= amount;

        if (toMove >= smooth.value.amount) {
          // only go to the next if we've moved the value completely
          smooth = smooth.next();
        }
      }

      return smooth;
    };

    const smoothL1 = moveSmooth({ toMove: minSmooth, smooth: getLinkedList(smooth1) });
    const smoothL2 = moveSmooth({ toMove: minSmooth, smooth: getLinkedList(smooth2) });

    const doRemaining = (
      { remaining, jumps, smooth }: { remaining: number, jumps: Mouvement[], smooth: LinkedList<Mouvement> },
    ) => {
      let moved = 0;
      for (const m of jumps) {
        if (m.amount > remaining) {
          break;
        }

        m.execute(m.amount);
        moved += m.amount;
        remaining -= m.amount;
      }

      while (!smooth.done && moved > 0) {
        const toMove = Math.min(smooth.value.amount, moved);
        smooth.value.execute(toMove);
        moved -= toMove;
        smooth = smooth.next();
      }
    };

    if (sumSmooth1 < sumSmooth2) {
      // console.log(sumSmooth1, sumSmooth2);
      doRemaining({ remaining: sumSmooth2 - sumSmooth1, jumps: jumps1, smooth: smoothL2 });
    } else if (sumSmooth2 < sumSmooth1) {
      doRemaining({ remaining: sumSmooth1 - sumSmooth2, jumps: jumps2, smooth: smoothL1 });
    }
  }

  public collapse() {
    if (this.collapsed) {
      return;
    }

    if (this.before.length === 0 && this.after.length === 0) {
      return;
    }

    const amount = this.size;
    if (this.before.length === 0) {
      const rightAfter = this.after[0];
      rightAfter.resize(-amount);
    } else {
      this.resize(amount);
    }
  }

  public unCollapse() {
    if (!this.collapsed) {
      return;
    }

    if (this.before.length === 0 && this.after.length === 0) {
      return;
    }

    const amount = Math.max(this.minSize, this.trueSize);
    console.log(this.name, this.minSize, this.trueSize, amount);
    if (this.before.length === 0) {
      const rightAfter = this.after[0];
      rightAfter.resize(amount);
    } else {
      this.resize(-amount);
    }
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
    // console.log('Do resize -> ' + this.name);

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
    const r1 = this.doResize([this], { px: window.innerWidth - this.width, direction: 'horizontal' });
    const r2 = this.doResize([this], { px: window.innerHeight - this.height, direction: 'vertical' });
    [...r1.mouvements, ...r2.mouvements].forEach((m) => {
      m.execute(m.amount);
    });
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
    const set = (s: Split, value: number, attr: 'height' | 'width') => {
      s[attr] = value;
      if (attr === 'height') {
        s.height = value;
        s.emit('heightResize', value);
      } else {
        s.width = value;
        s.emit('widthResize', value);
      }
    };

    if (!parent || parent.direction !== direction) {
      // This is definitely a bug
      // It won't appear until later though with embedded splits
      return {
        remaining: 0,
        mouvements: splits.map((split) => {
          const attr: 'width' | 'height' = direction === 'horizontal' ? 'width' : 'height';
          return {
            // type is irrelevant
            type: 'smooth',
            amount: px,
            execute: () => {
              this.doResize(split.childrenReversed, { px, direction }).mouvements.forEach((m) => {
                m.execute(m.amount);
              });
              set(split, split[attr] + px, attr);
            },
          };
        }),
      };
    }

    const originalSign = Math.sign(px) as 1 | -1;
    const changedSignOrZero = (value: number) => {
      return value === 0 || Math.sign(value) !== originalSign;
    };

    let getMouvement: (split: Split) => { type: 'jump' | 'smooth', amount: number } | undefined;
    if (mode === 'collapsible') {
      getMouvement = (split) => {
        // We want to collapse IFF:
        // 1. The split is actually collapsible
        // 2. We are considering collapsible stuff
        // 3. We've moved more than the amount of collapse pixels. This acts as a buffer.
        if (
          !split.collapsed &&
          split.collapsible &&
          px < -split.collapsePixels
        ) {
          return { type: 'jump', amount: -split.minSize };
        } else if (
          split.collapsed &&
          px >= split.minSize
        ) {
          return { type: 'jump', amount: px };
        }
      };
    } else {
      getMouvement = (split) => {
        if (split.collapsed) {
          return;
        }

        // If we aren't considering high priority, skip the splits with the `keep` flag
        if (split.keep && mode === 'high-priority') {
          return;
        }

        // If we are considering low priority, skip the splits without the `keep` flag
        if (!split.keep && mode === 'low-priority') {
          return;
        }

        const newSize = Math.max(split.minSize, Math.min(split.size + px, split.maxSize));
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
      if (split.fixed) {
        continue;
      }

      const mouvement = getMouvement(split);
      if (!mouvement) {
        continue;
      }

      const diff = mouvement.amount;
      px -= diff;

      mouvements.push({
        ...mouvement,
        execute: (amount) => {
          amount = Math.sign(diff) * Math.abs(amount);
          if (split.childrenReversed.length) {
            const r = this.doResize(split.childrenReversed, { px: amount, direction });
            r.mouvements.forEach((m) => m.execute(m.amount));
          }

          const newSize = split.size + amount;
          if (mouvement.type === 'jump') {
            split.collapsed = amount < 0;
            split.emit('collapsed', split.collapsed);
            if (split.parent!.direction === 'horizontal') {
              split.emit('widthResize', newSize);
            } else {
              split.emit('heightResize', newSize);
            }
          } else {
            if (split.parent!.direction === 'horizontal') {
              split.width = newSize;
              split.emit('widthResize', newSize);
            } else {
              split.height = newSize;
              split.emit('heightResize', newSize);
            }

            split.emit('resize', newSize);
          }
        },
      });
    }

    return {
      remaining: px,
      mouvements,
    };
  }

  // private get collapsed() {
  //   return this.size < this.minSize && this.size === 0;
  // }

  private get childrenReversed() {
    return this.children.slice().reverse();
  }
}
