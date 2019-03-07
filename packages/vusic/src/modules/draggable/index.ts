import Vue, { CreateElement } from 'vue';
import { Component, Prop, Mixins } from 'vue-property-decorator';
import { Watch } from '../update';

interface Point {
  x: number;
  y: number;
}

@Component
export class Draggable extends Vue {
  public previous: Point | null = null;
  public cursor = 'auto';
  public dragRef = 'drag';
  public moving = false;
  public in = false;
  public disabled = false;
  public mousewheelPosition: number | null = null;

  public $refs!: {
    drag: HTMLElement,
  };
  public mousemoveListener: (e: MouseEvent) => void = () => ({});
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
    this.previous = { x: e.clientX, y: e.clientY };
    this.mousemoveListener = (event) => this.startMove(event, ...args);
    window.addEventListener('mousemove', this.mousemoveListener);
    window.addEventListener('mouseup', this.removeListeners);
  }
  public removeListeners(e?: MouseEvent) {
    if (this.disabled) { return; }
    if (e) { this.prevent(e); }

    this.resetCursor();
    this.previous = null;
    this.moving = false;
    window.removeEventListener('mousemove', this.mousemoveListener);
    window.removeEventListener('mouseup', this.removeListeners);
    this.mousemoveListener = () => ({});
    this.afterHover();
    this.afterMove();
  }
  public afterMove() {
    //
  }

  public mousewheel(e: MouseWheelEvent) {
    if (!this.mousewheelPosition) {
      this.mousewheelPosition = 0;
    }

    // delta y is negative when scrolling away from user.
    this.mousewheelPosition -= e.deltaY;

    // 65 was determined from trial and error
    const y = Math.floor(this.mousewheelPosition / 65);
    this.mousewheelPosition %= 65;

    // Right now, we only support y movement and not x movement.
    this.scrollMove({ x: 0, y });
  }

  public startMove(e: MouseEvent, ...args: any[]) {
    if (this.disabled) { return; }

    if (!this.previous) {
      this.removeListeners();
      return;
    }

    this.prevent(e);
    const changeY = e.clientY - this.previous.y;
    const changeX = e.clientX - this.previous.x;

    this.previous = { x: e.clientX, y: e.clientY };
    this.move(e, ...args, { changeY, changeX });
  }

  public move(e: MouseEvent, ...args: any[]) {
    throw new Error('`move` is not defined');
  }

  public scrollMove(delta: { x: number, y: number }) {
    //
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
    this.mousewheelPosition = null;
    this.resetCursor();
  }
  public mounted() {
    const el = this.$refs.drag;
    if (!el) { return; }
    el.addEventListener('wheel', this.mousewheel);
    el.addEventListener('mousedown', this.addListeners);
    el.addEventListener('mouseup', this.removeListeners);
    el.addEventListener('mouseenter', this.onHover);
    el.addEventListener('mouseleave', this.afterHover);
    el.addEventListener('click', this.stopClick);
  }
  public stopClick(e: MouseEvent) {
    e.stopPropagation();
  }
  public destroyed() {
    const el = this.$refs.drag;
    if (!el) { return; }
    el.removeEventListener('mousedown', this.addListeners);
    el.removeEventListener('mouseup', this.removeListeners);
    el.removeEventListener('mouseenter', this.onHover);
    el.removeEventListener('mouseleave', this.afterHover);
    el.removeEventListener('click', this.stopClick);
  }
}

@Component
export class DragElement extends Mixins(Draggable) {
  @Prop({ type: String, default: 'div' }) public tag!: string;
  @Prop({ type: String, default: 'auto' }) public curse!: string;

  public move(e: MouseEvent) {
    this.$emit('move', e);
  }

  public render(createElement: CreateElement) {
    return createElement(this.tag, {
      class: 'draggable',
      on: {
        wheel: this.mousewheel,
        mousedown: this.addListeners,
        mouseup: this.removeListeners,
        mouseenter: this.onHover,
        mouseleave: this.afterHover,
        click: this.stopClick,
      },
    },
    this.$slots.default);
  }

  @Watch<DragElement>('curse', { immediate: true })
  public change() {
    this.cursor = this.curse;
  }
}


export default {
  install() {
    Vue.component('DragElement', DragElement);
  },
};
