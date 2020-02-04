import { ref, watch, Ref } from '@vue/composition-api';
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

export const isSplit = (vue: any): vue is { i: Section } => {
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
  public parent: null | Section = null;
  public direction: Direction | undefined;

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
  private name?: string;
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
    // TODO
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

    const move = (sections: Section[], toMove: number) => {
      let totalMoved = 0;
      totalMoved += this.iterate(sections, attr, toMove, 'high');
      totalMoved += this.iterate(sections, attr, toMove - totalMoved, 'low');
      totalMoved += this.iterate(sections, attr, toMove - totalMoved, 'collapse');
      totalMoved += this.iterate(sections, attr, toMove - totalMoved, 'fixed');
      return totalMoved;
    };

    px = move(shrinking, -Math.abs(px));
    move(growing, Math.abs(px));
  }

  public collapse() {
    this.collapseHelper('collapse');
  }

  public unCollapse() {
    this.collapseHelper('un-collapse');
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

    const direction = this.direction ? ', ' + this.direction.padEnd(10) : '';

    // tslint:disable-next-line:no-console
    console.log(
      `[INIT${direction}] ${this.name ? this.name.padEnd(5) : 'None '}| ` +
      `height -> ${sizes.height.toString().padEnd(4)}, width -> ${sizes.width.toString().padEnd(4)}`,
    );

    this.set('height', sizes.height);
    this.set('width', sizes.width);

    // There will never be a gutter for the first element
    // This logic may not be right but we are putting a gutter on any divider that doesn't touch a "fixed" split
    this.children.slice(1).forEach((_, i) => {
      this.children[i + 1].gutter.value = this.children[i].mode !== 'fixed' && this.children[i + 1].mode !== 'fixed';
    });

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

    this.toDispose.push(this.onDidHeightChange(() => {
      this.resize({ direction: 'vertical' });
    }));

    this.toDispose.push(this.onDidWidthChange(() => {
      this.resize({ direction: 'horizontal' });
    }));


    if (this.parent === null) {
      this.toDispose.push(addEventListener('resize', () => {
        this.width = window.innerWidth;
        this.height = window.innerWidth;
      }));
    }
  }

  public resize({ direction }: { direction: Direction }) {
    const attr = direction === 'horizontal' ? 'width' : 'height' as const;
    const oldSize = this.children.reduce((sum, child) => sum + child[attr], 0);
    let px = this[attr] - oldSize;
    console.log(attr, px, this[attr], oldSize);

    if (this.direction !== direction) {
      this.children.forEach((child) => {
        const newSize = this[attr];
        // tslint:disable-next-line:no-console
        console.log(
          `[PROP, ${attr}] ${child.name} ` +
          `from ${child[attr].toString().padEnd(3)} -> ${newSize.toString().padEnd(3)}`,
        );

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

  public onDidSizeChange(cb: (value: number) => void) {
    return this.events.addListener('resize', cb);
  }

  public onDidHeightChange(cb: (value: number) => void) {
    return this.events.addListener('height', cb);
  }

  public onDidWidthChange(cb: (value: number) => void) {
    return this.events.addListener('width', cb);
  }

  public onDidToggleCollapse(cb: (value: boolean) => void) {
    return this.events.addListener('collapsed', cb);
  }

  public set(attr: 'height' | 'width', value: number) {
    this[attr] = value;
    this.events.emit(attr, value);

    if (
      !this.parent ||
      !this.parent.direction ||
      this.disabled
    ) {
      return;
    }

    if (attr === 'height' && this.parent.direction === 'horizontal') {
      this.events.emit('resize', value);
    } else if (attr === 'width' && this.parent.direction === 'vertical') {
      this.events.emit('resize', value);
    }
  }

  private setCollapsed(value: boolean) {
    this.collapsed = value;
    this.events.emit('collapsed', value);
  }

  private collapseHelper(mode: 'collapse' | 'un-collapse') {
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
      const amount = Math.max(this[attr], this.minSize);
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

  private iterate(
    sections: Section[],
    attr: 'height' | 'width',
    toMove: number,
    mode: 'low' | 'high' | 'fixed' | 'collapse',
  ) {
    let moved = 0;
    for (const section of sections) {
      // console.log(section.name, mode)
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

      // tslint:disable-next-line:no-console
      console.log(
        `[${mode.padEnd(6)}][${attr}] ${section.name} ` +
        `from ${section[attr].toString().padEnd(3)} -> ${newSize.toString().padEnd(3)}`,
      );

      const diff = newSize - section[attr];
      section.set(attr, newSize);
      toMove -= diff;
      moved += diff;
    }

    return moved;
  }
}
