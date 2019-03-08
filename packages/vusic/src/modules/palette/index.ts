import { Component, Vue, Prop } from 'vue-property-decorator';
import { CreateElement } from 'vue';
import { Bus, Watch } from '@/modules/update';

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
  'Space';

export interface PaletteItem {
  text: string;
  callback: () => void;
  shortcut?: Key[];
}

@Component
export class Results extends Vue {
  @Prop({ type: Array, required: true }) public items!: PaletteItem[];

  public render(h: CreateElement) {
    const children = this.items.map((item) => {
      const shortcutText = (item.shortcut || []).join('+');

      const text = h('span', item.text);
      const spacer = h('div', { style: { flex: '1' } });
      const shortcut = h('span', shortcutText);

      return h('div', {
        style: {
          display: 'flex',
          padding: '3px 6px',
          color: '#ddd',
        },
      }, [text, spacer, shortcut]);
    });
    return h('div', children);
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

  get tokenized() {
    return this.items.map((item) => {
      return item.text.split(/ +/).map((token) => token.toLowerCase());
    });
  }

  get filtered() {
    if (!this.searchText) {
      return this.items;
    }

    return this.tokenized.filter((tokens) => {
      return tokens.some((token) => token.startsWith(this.searchText));
    }).map((_, i) => this.items[i]);
  }

  public open() {
    this.$emit('input', true);
  }

  public close(e: KeyboardEvent) {
    if (e.which === 27) {
      e.preventDefault();
      this.$emit('input', false);
    }
  }

  public mounted() {
    bus.$on('open', this.open);
  }

  public destroyed() {
    bus.$off('open', this.open);
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

    const results = h(Results, {
      props: {
        items: this.filtered,
      },
      style: {
        margin: '0 5px',
      },
    });

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
        zIndex: '2',
        color: '#ddd',
      },
      on: {
        click: () => {
          this.$emit('input', false);
        },
      },
    }, children);
  }

  @Watch<Palette>('value')
  public addEscListener() {
    if (this.value) {
      window.addEventListener('keydown', this.close);
    } else {
      window.removeEventListener('keydown', this.close);
    }
  }
}

export default {
  install() {
    Vue.component('Palette', Palette);
  },
};
