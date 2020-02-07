import { ref } from '@vue/composition-api';
import { StrictEventEmitter } from '@/lib/events';
import { addEventListener } from '@/utils';

export type Direction = 'horizontal' | 'vertical';

export const isSplit = (vue: any): vue is { i: Section } => {
  return vue.$options.name === 'Split';
};

// tslint:disable-next-line:interface-over-type-literal
type SplitEvents = {
  height: [number];
  width: [number];
  resize: [number];
  collapsed: [boolean];
};

export type SectionMode = 'low' | 'high' | 'fixed';
export interface SectionOpts {
  name?: string;
  collapsible?: boolean;
  minSize?: number;
  collapsePixels?: number;
  direction?: Direction;
  initial?: number;
  mode?: SectionMode;
  collapsed?: boolean;
}

export class Section {
  public static DEBUG = false;
  public parent: null | Section = null;
  public direction: Direction | undefined;
  public readonly name?: string;

  private gutter = ref(false);
  private disabled = false;
  private width = 0;
  private height = 0;
  private minSize: number;
  private children: Section[] = [];
  private toDispose: Array<{ dispose: () => void }> = [];
  private mode: SectionMode;
  private collapsible: boolean;
  private collapsed: boolean;
  private collapsePixels: number;
  private initial: number | undefined;
  private events = new StrictEventEmitter<SplitEvents>();

  // tslint:disable-next-line:member-ordering
  public addListeners = this.events.addListeners.bind(this.events);

  constructor(o: SectionOpts = {}) {
    this.minSize = o.minSize || 15;
    this.collapsible = !!o.collapsible;
    this.name = o.name;
    this.collapsePixels = o.collapsePixels || 10;
    this.direction = o.direction;
    this.initial = o.initial;
    this.mode = o.mode || 'high';
    this.collapsed = !!o.collapsed;
  }

  get sizes() {
    return {
      height: this.height,
      width: this.width,
    };
  }

  get isCollapsed() {
    return this.collapsed;
  }

  get isGutter() {
    return this.gutter.value;
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

    const move = (sections: Section[], toMoveInner: number) => {
      let totalMoved = 0;
      totalMoved += this.iterate(sections, attr, toMoveInner, 'high');
      totalMoved += this.iterate(sections, attr, toMoveInner - totalMoved, 'low');
      totalMoved += this.iterate(sections, attr, toMoveInner - totalMoved, 'collapse');
      return totalMoved;
    };

    // When growing, if something un-collapses, then we need to run everything again
    const shrunk = move(shrinking, -Math.abs(px));
    let toMove = -shrunk;
    while (true) {
      const change = move(growing, toMove);
      toMove -= change;
      if (change === 0 || toMove <= 0) {
        break;
      }
    }

    // A bit of a hack but this works for now
    move(shrinking, toMove);
  }

  public collapse() {
    this.collapseHelper({ mode: 'collapse' });
  }

  public unCollapse(size: number) {
    this.collapseHelper({ mode: 'un-collapse', size });
  }

  public init(sizes?: { height: number, width: number }) {
    if (!sizes) {
      if (this.parent) {
        return;
      }

      sizes = {
        height: window.innerHeight,
        width: window.innerWidth,
      };
    }

    // tslint:disable
    Section.DEBUG && console.log(
      `[INIT${this.direction ? ', ' + this.direction.padEnd(10) : ''}] ${this.name ? this.name.padEnd(5) : 'None '}| ` +
      `height -> ${sizes.height.toString().padEnd(4)}, width -> ${sizes.width.toString().padEnd(4)}`,
    );
    // tslint:enable

    this.set('height', sizes.height, false);
    this.set('width', sizes.width, false);

    // There will never be a gutter for the first element
    // This logic may not be right but we are putting a gutter on any divider that doesn't touch a "fixed" split
    this.children.slice(1).forEach((_, i) => {
      this.children[i + 1].gutter.value = this.children[i].mode !== 'fixed' && this.children[i + 1].mode !== 'fixed';
    });

    const initialSum = this.children.reduce((sum, curr) => {
      return sum + (curr.collapsed ? 0 : curr.initial ? curr.initial : 0);
    }, 0);

    const total = this.direction === 'horizontal' ? this.width : this.height;
    const remaining = total - initialSum;
    const notFixed = this.children.filter((child) => child.initial === undefined && child.collapsed === false);
    const size = remaining / notFixed.length;

    this.children.forEach((split) => {
      const splitSize = split.collapsed ? 0 : split.initial !== undefined ? split.initial : size;

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

    this.toDispose.push(this.addListeners({
      height: () => this.resize({ direction: 'vertical' }),
      width: () => this.resize({ direction: 'horizontal' }),
    }));

    if (this.parent === null) {
      this.toDispose.push(addEventListener('resize', () => {
        this.set('width', window.innerWidth);
        this.set('height', window.innerHeight);
      }));
    }
  }

  public resize({ direction }: { direction: Direction }) {
    const attr = direction === 'horizontal' ? 'width' : 'height' as const;
    const oldSize = this.children.reduce((sum, child) => sum + child[attr], 0);
    let px = this[attr] - oldSize;

    if (this.direction !== direction) {
      this.children.forEach((child) => {
        const newSize = this[attr];
        // tslint:disable
        Section.DEBUG && console.log(
          `[PROP, ${attr}] ${child.name} ` +
          `from ${child[attr].toString().padEnd(3)} -> ${newSize.toString().padEnd(3)}`,
        );
        // tslint:enable

        child.set(attr, newSize);
      });
      return;
    }

    px -= this.iterate(this.children, attr, px, 'high');
    px -= this.iterate(this.children, attr, px, 'low');
    this.iterate(this.children, attr, px, 'fixed');
  }

  public dispose() {
    this.toDispose.forEach(({ dispose }) => dispose());
    this.toDispose = [];
  }

  /**
   * Just a helper method which emits the appropriate events.
   *
   * @param attr
   * @param value
   * @param emit Whether to emit the "resize" event. We set this to false during initialization.
   */
  public set(attr: 'height' | 'width', value: number, emit: boolean = true) {
    this[attr] = value;
    this.events.emit(attr, value);

    if (
      !this.parent ||
      !this.parent.direction ||
      this.disabled
    ) {
      return;
    }

    if (!emit) {
      return;
    }

    if (attr === 'height' && this.parent.direction === 'vertical') {
      this.events.emit('resize', value);
    } else if (attr === 'width' && this.parent.direction === 'horizontal') {
      this.events.emit('resize', value);
    }
  }

  private setCollapsed(value: boolean) {
    this.collapsed = value;
    this.events.emit('collapsed', value);
  }

  private collapseHelper(opts: { mode: 'collapse' } | { mode: 'un-collapse', size: number }) {
    const mode = opts.mode;

    if (
      (mode === 'collapse' && this.collapsed) ||
      (mode === 'un-collapse' && !this.collapsed) ||
      !this.parent
    ) {
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
      const amount = Math.max(this[attr], this.minSize, opts.mode === 'un-collapse' ? opts.size : 0);
      // after.length will never be 0
      if (after.length === 1) {
        this.move(amount * hasBeforeMultiple);
      } else {
        const rightAfter = after[1];
        rightAfter.move(amount * noBeforeMultiple);
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

  private iterate(
    sections: Section[],
    attr: 'height' | 'width',
    toMove: number,
    mode: 'low' | 'high' | 'fixed' | 'collapse',
  ) {
    let moved = 0;
    for (const section of sections) {
      if (
        (mode === 'high' || mode === 'low' || mode === 'fixed') &&
        (mode !== section.mode || section.collapsed)) {
        continue;
      }

      if (toMove === 0) {
        break;
      }

      let newSize = section[attr];

      if (mode === 'high' || mode === 'low' || mode === 'fixed') {
        newSize = Math.max(section.minSize, section[attr] + toMove);
        if (newSize === section[attr]) {
          continue;
        }
      } else {
        if (
          section.collapsible &&
          !section.collapsed &&
          toMove < -section.collapsePixels
        ) {
          section.setCollapsed(true);
          newSize = 0;
        } else if (
          section.collapsible &&
          section.collapsed &&
          toMove >= section.minSize
        ) {
          section.setCollapsed(false);
          newSize = section.minSize;
        } else {
          continue;
        }
      }

      // tslint:disable
      Section.DEBUG && console.log(
        `[${mode.padEnd(6)}][${attr}] ${section.name} ` +
        `from ${section[attr].toString().padEnd(3)} -> ${newSize.toString().padEnd(3)}`,
      );
      // tslint:enable

      const diff = newSize - section[attr];
      section.set(attr, newSize);
      toMove -= diff;
      moved += diff;
    }

    return moved;
  }
}
