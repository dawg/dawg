import Vue, { CreateElement } from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator';

interface Point {
  x: number;
  y: number;
}

@Component
export class DragElement extends Vue {
  @Prop({ type: String, default: 'div' }) public tag!: string;
  @Prop({ type: Boolean }) public within!: boolean;
  // TODO Rename to cursor
  @Prop({ type: String, default: 'auto' }) public curse!: string;

  public previous: Point | null = null;
  public cursor = 'auto';
  public moving = false;
  public in = false;
  public disabled = false;
  public mousewheelPosition: number | null = null;

  public move(e: MouseEvent) {
    this.$emit('move', e);
  }

  public beforeMove() {
    this.$emit('before-move');
  }

  public afterMove() {
    this.$emit('after-move');
  }

  public scrollMove(delta: Point) {
    this.$emit('scroll-move', delta);
  }

  public render(createElement: CreateElement) {
    return createElement(this.tag, {
      class: 'draggable',
      on: {
        wheel: this.mousewheel,
        mousedown: this.addListeners,
        mouseenter: this.onHover,
        mouseleave: this.afterHover,
        click: this.stopClick,
      },
    },
    this.$slots.default);
  }

  @Watch('curse', { immediate: true })
  public change() {
    this.cursor = this.curse;
  }

  @Watch('in', { immediate: true })
  public updateWithin() {
    this.$update('within', this.in);
  }


  // DRAGGABLE
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

  public addListeners(e: MouseEvent) {
    if (e.which !== 1) { return; } // if not left click
    if (this.disabled) { return; }

    this.prevent(e);
    this.showCursor();
    this.moving = true;
    this.previous = { x: e.clientX, y: e.clientY };

    this.beforeMove();
    window.addEventListener('mousemove', this.startMove);
    window.addEventListener('mouseup', this.removeListeners);
  }

  public removeListeners(e?: MouseEvent) {
    if (this.disabled) { return; }
    if (e) { this.prevent(e); }

    this.resetCursor();
    this.previous = null;
    this.moving = false;
    window.removeEventListener('mousemove', this.startMove);
    window.removeEventListener('mouseup', this.removeListeners);

    this.afterHover();
    this.afterMove();
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

  public startMove(e: MouseEvent) {
    if (this.disabled) { return; }

    if (!this.previous) {
      this.removeListeners();
      return;
    }

    this.prevent(e);
    const changeY = e.clientY - this.previous.y;
    const changeX = e.clientX - this.previous.x;

    this.previous = { x: e.clientX, y: e.clientY };
    this.move(e);
  }

  public squash(v: number, low: number, high: number) {
    return Math.max(low, Math.min(high, v));
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

  public stopClick(e: MouseEvent) {
    e.stopPropagation();
  }

  public destroyed() {
    // Always reset when destroyed
    // We can get into weird states where the component is destroyed while hovering
    this.afterHover();
  }
}


export default {
  // tslint:disable-next-line:no-shadowed-variable
  install(Vue: any) {
    Vue.component('DragElement', DragElement);
  },
};
