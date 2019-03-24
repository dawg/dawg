import Vue, { CreateElement, VueConstructor } from 'vue';
import { Prop, Inject, Component, Mixins } from 'vue-property-decorator';
import tinycolor from 'tinycolor2';
import { Draggable } from '@/modules/draggable';
import { createHOC } from '@/modules/utils';

export const positionable = (component: VueConstructor) => {
  @Component
  class Positionable extends Vue {
    @Prop({ type: Number, default: 0 }) public left!: number;
    @Prop({ type: Number, default: 0 }) public top!: number;

    get style() {
      return {
        left: `${this.left}px`,
        top: `${this.top}px`,
        position: 'absolute',
      };
    }

    public render(createElement: CreateElement) {
      return createHOC(component, createElement, this, {
        style: this.style,
      });
    }
  }

  return Positionable;
};

export const colored = (component: VueConstructor) => {
  @Component
  class Colored extends Vue {
    @Prop({ type: String, default: '#ccc' }) public color!: string;
    public percentage = 15;

    get lightColor() {
      const color = tinycolor(this.color).lighten(this.percentage).setAlpha(.1).toRgbString();
      return `${color}`;
    }

    public render(createElement: CreateElement) {
      const element = createHOC(component, createElement, this);

      const top = createElement('div', {
        style: {
          backgroundColor: this.color,
          height: '8px',
          width: '100%',
        },
        class: 'top',
      });

      return createElement('div', {
        class: 'colored',
        style: {
          backgroundColor: this.lightColor,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        },
      }, [top, element]);
    }
  }

  return Colored;
};


export const selectable = (component: VueConstructor) => {
  @Component
  class Selectable extends Vue {
    @Prop({ type: Boolean, default: false }) public selected!: boolean;

    get style() {
      if (this.selected) {
        return {
          backgroundColor: '#ff9999!important',
        };
      }
    }

    public render(createElement: CreateElement) {
      return createHOC(component, createElement, this, {
        style: this.style,
      });
    }
  }

  return Selectable;
};

export const resizable = (component: VueConstructor) => {
  @Component
  class Resizable extends Mixins(Draggable) {
    @Prop({ type: Number, required: true }) public snap!: number;
    @Prop({ type: Number, required: true }) public pxPerBeat!: number;

    @Prop({ type: Number, required: true }) public height!: number;
    @Prop({ type: Number, required: true }) public duration!: number;
    @Prop({ type: String, required: false }) public hoverClass?: string;
    @Prop({ type: String, required: false }) public hoverColor?: string;
    @Prop({ type: Number, default: 8 }) public dragAreaWidth!: number;

    public cursor = 'ew-resize';

    get style() {
      const style: { [k: string]: string | number } = {
        width: `${this.dragAreaWidth}px`,
        position: 'absolute',
        right: 0,
        top: 0,
        height: `${this.height}px`,
      };

      if (this.in && this.hoverClass) {
        style.backgroundColor = this.hoverClass;
      }

      return style;
    }

    get width() {
      return Math.max(this.duration * this.pxPerBeat, 2);
    }

    get componentStyle() {
      return {
        height: `${this.height}px`,
      };
    }

    get resizeAreaClass() {
      if (this.in) {
        return this.hoverClass;
      }
    }

    public move(e: MouseEvent) {
      const diff = e.clientX - this.$parent.$el.getBoundingClientRect().left;
      let length = diff / this.pxPerBeat;
      length = Math.round(length / this.snap) * this.snap;
      if (this.duration === length) { return; }
      if (length < this.snap) { return; }
      this.$update('duration', length);
    }

    public render(createElement: CreateElement) {
      const element = createHOC(component, createElement, this, {
        style: this.componentStyle,
      });

      const resizeArea = createElement('div', {
        style: this.style,
        class: 'resize-area',
        on: {
          mouseenter: this.onHover,
          mouseleave: this.afterHover,
          mousedown: this.addListeners,
        },
      });

      return createElement('div', {
        class: 'resizable',
        style: {
          position: 'relative',
          display: 'inline-block',
          overflow: 'hidden',
          width: `${this.width}px`,
        },
      }, [element, resizeArea]);
    }
  }

  return Resizable;
};
