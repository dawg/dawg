export const vmodel = {
  props: ['value'],
  data() {
    return {
      content: this.value,
    };
  },
  methods: {
    input() {
      this.$emit('input', this.content);
    },
  },
  watch: {
    value() {
      this.content = this.value;
    },
  },
};

export const px = {
  methods: {
    px(size) {
      return `${size}px`;
    },
    hw(h, w) {
      return {
        height: this.px(h),
        width: this.px(w),
      };
    },
    lightenDarken(color, amount) {
      let usePound = false;

      if (color[0] === '#') {
        // eslint-disable-next-linecolor = color.slice(1);
        usePound = true;
      }

      const num = parseInt(color, 16);

      // eslint-disable-next-line no-bitwise
      let r = (num >> 16) + amount;
      if (r > 255) r = 255;
      else if (r < 0) r = 0;

      // eslint-disable-next-line no-bitwise
      let b = ((num >> 8) & 0x00FF) + amount;
      if (b > 255) b = 255;
      else if (b < 0) b = 0;

      // eslint-disable-next-line no-bitwise
      let g = (num & 0x0000FF) + amount;
      if (g > 255) g = 255;
      else if (g < 0) g = 0;

      // eslint-disable-next-line no-bitwise
      return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16);
    },
    lighten(color, amount) {
      return this.lightenDarken(color, -Math.abs(amount));
    },
  },
};

export const draggable = {
  props: { disabled: { type: Boolean, default: false } },
  data() {
    return {
      previous: null,
      cursor: 'auto',
      dragRef: 'drag',
      moving: false,
      mousemoveListner: null,
      in: false,
    };
  },
  methods: {
    showCursor() {
      document.documentElement.style.cursor = this.cursor;
    },
    resetCursor() {
      document.documentElement.style.cursor = 'auto';
    },
    addListeners(e, ...args) {
      if (!e.which) throw Error(`Given event must be mouse event: ${e}`);
      if (e.which !== 1) return; // if not left click
      if (this.disabled) return;

      this.prevent(e);
      this.showCursor();
      this.moving = true;
      this.previous = { x: e.clientX, y: e.clientY };
      this.mousemoveListner = event => this.startMove(event, ...args);
      window.addEventListener('mousemove', this.mousemoveListner);
      window.addEventListener('mouseup', this.removeListeners);
    },
    removeListeners(e) {
      if (this.disabled) return;

      this.prevent(e);
      this.resetCursor();
      this.previous = null;
      this.moving = null;
      window.removeEventListener('mousemove', this.mousemoveListner);
      window.removeEventListener('mouseup', this.removeListeners);
      this.mousemoveListner = null;
      this.afterHover();
    },
    startMove(e, ...args) {
      if (this.disabled) return;

      this.prevent(e);
      const changeY = e.clientY - this.previous.y;
      const changeX = e.clientX - this.previous.x;

      this.previous = { x: e.clientX, y: e.clientY };
      this.move(e, ...args, { changeY, changeX });
    },
    move() {
      console.warn('`move` is not defined');
    },
    squash(v, low, high) {
      return Math.max(low, Math.min(high, v));
    },
    mapRange(x, inMin, inMax, outMin, outMax) {
      return (((x - inMin) * (outMax - outMin)) / (inMax - inMin)) + outMin;
    },
    prevent(e) {
      if (e && e.preventDefault) e.preventDefault();
    },
    onHover() {
      if (this.moving) return;
      this.in = true;
      this.showCursor();
    },
    afterHover() {
      if (this.moving) return;
      this.in = false;
      this.resetCursor();
    },
  },
  mounted() {
    const el = this.$refs[this.dragRef];
    if (!el) return;

    el.addEventListener('mousedown', this.addListeners);
    el.addEventListener('mouseup', this.removeListeners);
    el.addEventListener('mouseenter', this.onHover);
    el.addEventListener('mouseleave', this.afterHover);
  },
  destroyed() {
    const el = this.$refs[this.dragRef];
    if (!el) return;

    el.removeEventListener('mousedown', this.addListeners);
    el.removeEventListener('mouseup', this.removeListeners);
    el.removeEventListener('mouseenter', this.onHover);
    el.removeEventListener('mouseleave', this.afterHover);
  },
};

export const konva = {
  methods: {
    emit(_, { evt }) {
      this.$emit(evt.type, evt);
    },
    process(handler) {
      return (_, { evt }) => handler(evt);
    },
  },
};
