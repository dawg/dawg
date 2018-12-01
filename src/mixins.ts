import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

@Component({
  props: ['value'],
})
export class PX extends Vue {
  public px(size: string | number) {
    return `${size}px`;
  }
  public hw(h: string | number, w: string | number) {
    return {
      height: this.px(h),
      width: this.px(w),
    };
  }
}

// tslint:disable-next-line:max-classes-per-file
class Point {
  constructor(public x: number, public y: number) {}
}

// tslint:disable-next-line:max-classes-per-file
@Component
export class Draggable extends Vue {
  public previous: Point | null = null;
  public cursor = 'auto';
  public dragRef = 'drag';
  public moving = false;
  public in = false;
  public disabled = false;

  public $refs!: {
    drag: HTMLElement,
  };
  public mousemoveListner: (e: MouseEvent) => void = () => ({});
  public showCursor() {
    if (document.documentElement) {
      document.documentElement.style.cursor = this.cursor;
    }
  }
  public resetCursor() {
    if (document.documentElement) {
      document.documentElement.style.cursor = 'auto';
    }
  }
  public addListeners(e: MouseEvent, ...args: any[]) {
    if (e.which !== 1) { return; } // if not left click
    if (this.disabled) { return; }

    this.prevent(e);
    this.showCursor();
    this.moving = true;
    this.previous = new Point(e.clientX, e.clientY);
    this.mousemoveListner = (event) => this.startMove(event, ...args);
    window.addEventListener('mousemove', this.mousemoveListner);
    window.addEventListener('mouseup', this.removeListeners);
  }
  public removeListeners(e: MouseEvent) {
    if (this.disabled) { return; }

    this.prevent(e);
    this.resetCursor();
    this.previous = null;
    this.moving = false;
    window.removeEventListener('mousemove', this.mousemoveListner);
    window.removeEventListener('mouseup', this.removeListeners);
    this.mousemoveListner = () => ({});
    this.afterHover();
    this.afterMove();
  }
  public afterMove() {
    //
  }
  public startMove(e: MouseEvent, ...args: any[]) {
    if (this.disabled) { return; }

    this.prevent(e);
    const changeY = e.clientY - this.previous!.y;
    const changeX = e.clientX - this.previous!.x;

    this.previous = { x: e.clientX, y: e.clientY };
    this.move(e, ...args, { changeY, changeX });
  }
  public move(e: MouseEvent, ...args: any[]) {
    throw new Error('`move` is not defined');
  }
  public squash(v: number, low: number, high: number) {
    return Math.max(low, Math.min(high, v));
  }
  public mapRange(x: number, inMin: number, inMax: number, outMin: number, outMax: number) {
    return (((x - inMin) * (outMax - outMin)) / (inMax - inMin)) + outMin;
  }
  public prevent(e: Event) {
    if (e && e.preventDefault) { e.preventDefault(); }
    if (e && e.stopPropagation) { e.stopPropagation(); }
  }
  public onHover() {
    if (this.moving) { return; }
    this.in = true;
    this.showCursor();
  }
  public afterHover() {
    if (this.moving) { return; }
    this.in = false;
    this.resetCursor();
  }
  public mounted() {
    const el = this.$refs.drag;
    if (!el) { return; }

    el.addEventListener('mousedown', this.addListeners);
    el.addEventListener('mouseup', this.removeListeners);
    el.addEventListener('mouseenter', this.onHover);
    el.addEventListener('mouseleave', this.afterHover);
  }
  public destroyed() {
    const el = this.$refs.drag;
    if (!el) { return; }

    el.removeEventListener('mousedown', this.addListeners);
    el.removeEventListener('mouseup', this.removeListeners);
    el.removeEventListener('mouseenter', this.onHover);
    el.removeEventListener('mouseleave', this.afterHover);
  }
}
