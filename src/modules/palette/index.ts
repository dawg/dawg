import { Component, Vue, Prop } from 'vue-property-decorator';
import { CreateElement } from 'vue';
import { Bus, Watch } from '@/modules/update';
import { reverse } from '@/utils';

export const bus = new Bus<{ open: [] }>();
export type Key =
  'Shift' |
  'Ctrl' |
  'A' |
  'B' |
  'C' |
  'D' |
  'E' |
  'F' |
  'G' |
  'H' |
  'I' |
  'J' |
  'K' |
  'L' |
  'M' |
  'N' |
  'O' |
  'P' |
  'Q' |
  'R' |
  'S' |
  'T' |
  'U' |
  'V' |
  'W' |
  'X' |
  'Y' |
  'Z' |
  'Space' |
  'Del' |
  'Esc' |
  'Tab';

type KeyCodeLookup = { [k in Key]: number | number[] };

const stack: Array<{ shortcut: Key[], callback: () => void }> = [];

const codeLookup: KeyCodeLookup = {
  Shift: 16,
  Ctrl: [17, 55], // 55 is the Mac command key
  A: 65,
  B: 66,
  C: 67,
  D: 68,
  E: 69,
  F: 70,
  G: 71,
  H: 72,
  I: 73,
  J: 74,
  K: 75,
  L: 76,
  M: 77,
  N: 78,
  O: 79,
  P: 80,
  Q: 81,
  R: 82,
  S: 83,
  T: 84,
  U: 85,
  V: 86,
  W: 87,
  X: 88,
  Y: 89,
  Z: 90,
  Space: 32,
  Del: 46,
  Tab: 9,
  Esc: 27.,
};

export interface PaletteItem {
  text: string;
  callback: () => void;
  shortcut?: Key[];
}

function shortcutPressed(shortcut: Key[], pressedKeys: Set<number>) {
  if (pressedKeys.size !== shortcut.length) {
    return false;
  }

  // Just to be sure. I think the previous if statement is fine though.
  if (shortcut.length === 0) {
    return false;
  }

  const has = (keys: number | number[]) => {
    if (typeof keys === 'number') {
      keys = [keys];
    }

    return keys.some((key) => pressedKeys.has(key));
  };

  if (!shortcut.every((key) => has(codeLookup[key]))) {
    return false;
  }

  return true;
}

@Component
class Result extends Vue {
  @Prop({ type: Object, required: true }) public item!: PaletteItem;
  @Prop({ type: Boolean, required: true }) public selected!: boolean;

  public hover = false;
  public selectColor = 'rgba(255, 255, 255, 0.25)';
  public hoverColor = 'rgba(255, 255, 255, 0.25)';

  get style() {
    return {
      background: this.selected ? this.selectColor : this.hover ? this.hoverColor : undefined,
      cursor: this.hover ? 'pointer' : undefined,
      display: 'flex',
      padding: '3px 6px',
      color: '#ddd',
    };
  }

  public render(h: CreateElement) {
    const shortcutText = (this.item.shortcut || []).join('+');

    const text = h('span', this.item.text);
    const spacer = h('div', { style: { flex: '1' } });
    const shortcut = h('span', shortcutText);

    return h('div', {
      on: {
        mouseover: () => {
          this.hover = true;
        },
        mouseleave: () => {
          this.hover = false;
        },
      },
      style: this.style,
    }, [text, spacer, shortcut]);
  }
}

// NOT SUre if we should render this globally
// ....... oh well
Vue.directive('focus', {
  inserted(el) {
    el.focus();
  },
});

@Component
export class TextField extends Vue {
  @Prop({ type: String, required: true }) public value!: string;
  @Prop({ type: Boolean, default: false }) public autofocus!: boolean;

  public render(h: CreateElement) {
    const directives = this.autofocus ? [{ name: 'focus' }] : [];

    return h('input', {
      props: {
        value: this.value,
      },
      on: {
        input: (e: { target: HTMLInputElement }) => {
          this.$emit('input', e.target.value);
        },
        click: (e: MouseEvent) => {
          e.stopPropagation();
        },
      },
      style: {
        padding: '5px',
        overflow: 'hidden',
        // the width + margin is being weird
        // so I took out the margin with a calc
        width: 'calc(100% - 10px)',
        margin: '5px',
      },
      directives,
    });
  }
}

@Component
class Palette extends Vue {
  @Prop({ type: Boolean, required: true }) public value!: boolean;
  @Prop({ type: String, required: false }) public paletteClass?: string;
  @Prop({ type: Array, required: true }) public items!: PaletteItem[];

  public searchText = '';
  public selected = 0;

  public pressedKeys = new Set<number>();

  get tokenized() {
    return this.items.map((item) => {
      return item.text.split(/ +/).map((token) => token.toLowerCase());
    });
  }

  get searchWords() {
    return this.searchText.toLowerCase().split(/ +/);
  }

  get filtered() {
    if (!this.searchText) {
      return this.items;
    }

    return this.tokenized
      .map((tokens, i) => {
        if (this.searchWords.every((word) => {
          return tokens.some((token) => token.startsWith(word));
        })) {
          return this.items[i];
        }
      }).filter((item) => item);
  }

  public open() {
    this.$emit('input', true);
  }

  public keydown(e: KeyboardEvent) {
    this.pressedKeys.add(e.which);

    if (e.which === 27) { // ESC
      e.preventDefault();
      this.$emit('input', false);
    }

    if (e.which === 38) { // UP
      this.selected = Math.max(this.selected - 1, 0);
    } else if (e.which === 40) { // DOWN
      this.selected = Math.min(this.selected + 1, this.filtered.length - 1);
    }

    if (e.which === 13) { // ENTER
      const item = this.filtered[this.selected];
      if (!item) {
        return;
      }

      item.callback();
      this.$emit('input', false);
    }

    let i = stack.length - 1;
    for (const item of reverse(stack)) {
      if (shortcutPressed(item.shortcut, this.pressedKeys)) {
        item.callback();
        stack.splice(i, 1);
        return;
      }
      i--;
    }

    this.items.forEach((item) => {
      if (!item.shortcut) {
        return;
      }

      if (shortcutPressed(item.shortcut, this.pressedKeys)) {
        item.callback();
      }
    });
  }

  public keyup(e: KeyboardEvent) {
    this.pressedKeys.delete(e.which);
  }

  public mounted() {
    bus.$on('open', this.open);
    window.addEventListener('keydown', this.keydown);
    window.addEventListener('keyup', this.keyup);
  }

  public destroyed() {
    bus.$off('open', this.open);
    window.removeEventListener('keydown', this.keydown);
    window.removeEventListener('keyup', this.keyup);
  }

  @Watch<Palette>('filtered')
  public resetSelected() {
    this.selected = 0;
  }

  @Watch<Palette>('value')
  public resetSearch() {
    if (this.value) {
      this.searchText = '';
    }
  }

  public render(h: CreateElement) {
    const search = h(TextField, {
      props: {
        value: this.searchText,
        autofocus: true,
      },
      on: {
        input: (text: string) => {
          this.searchText = text;
        },
      },
    });


    const items = this.filtered.map((item, i) => {
      return h(Result, {
        props: {
          item,
          selected: this.selected === i,
        },
      });
    });

    const results = h('div', { style: { margin: '5px' } }, items);

    const palette = h('div', {
      class: this.paletteClass,
      style: {
        width: '400px',
        height: 'fit-content',
      },
    }, [search, results]);

    const children = this.value ? [palette] : [];

    // Render OVERLAY as base element
    return h('div', {
      style: {
        position: 'fixed',
        display: this.value ? 'flex' : 'none',
        justifyContent: 'center',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: '2000',
        color: '#ddd',
      },
      on: {
        click: () => {
          this.$emit('input', false);
        },
      },
    }, children);
  }
}

// TODO(jacob) use stack to store keyboard shortcut information??
export default {
  install() {
    Vue.component('Palette', Palette);

    Vue.prototype.$press = (shortcut: Key[], callback: () => void) => {
      stack.push({ shortcut, callback });
    };
  },
};


export interface PaletteAugmentation {
  // TODO Rename this
  // Furthermore, this will cause issues when the callbacks are called another way
  // THere must be some way to invalidate a callback
  $press(shortcut: Key[], callback: () => void): void;
}
