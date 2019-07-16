import { Component, Vue, Prop } from 'vue-property-decorator';
import { CreateElement } from 'vue';
import { Watch } from '@/modules/update';
import * as events from '@/dawg/events';

export interface PaletteOptions {
  /**
   * Whether to call the callback when selected using the arrow keys.
   */
  automatic?: boolean;
  placeholder?: string;
}

interface PaletteEvents {
  show: (items: DetailedItem[], opts?: PaletteOptions) => void;
  cancel: () => void;
  select: (text: string) => void;
  focus: (text: string) => void;
}

export const paletteEvents = events.emitter<PaletteEvents>();

export interface DetailedItem {
  text: string;
  action?: string;
}

@Component
class Result extends Vue {
  @Prop({ type: Object, required: true }) public item!: DetailedItem;
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
    };
  }

  public render(h: CreateElement) {
    const shortcutText = this.item.action;

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
      class: 'foreground--text',
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
  @Prop({ type: String, default: '' }) public placeholder!: string;

  public render(h: CreateElement) {
    const directives = this.autofocus ? [{ name: 'focus' }] : [];

    return h('input', {
      props: {
        value: this.value,
        placeholder: this.placeholder,
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
export class Palette extends Vue {
  public value = false;
  public items: DetailedItem[] = [];
  public placeholder = '';
  public searchText = '';
  public selected = 0;

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

  public mounted() {
    paletteEvents.on('show', this.show);
  }

  public destroyed() {
    paletteEvents.removeListener('show', this.show);
  }

  public show(items: DetailedItem[], opts: PaletteOptions = {}) {
    this.items = items;
    this.value = true;
    this.searchText = '';
  }

  public open() {
    this.value = true;
  }

  public checkEnterEsc(e: KeyboardEvent) {
    if (e.which === 27) { // ESC
      // TODOLATER
      // e.preventDefault();
      paletteEvents.emit('cancel');
      this.value = false;
    }

    let newIndex: null | number = null;

    if (e.which === 38) { // UP
      newIndex = this.selected - 1;
    } else if (e.which === 40) { // DOWN
      newIndex = this.selected + 1;
    }

    if (newIndex !== null) {
      if (newIndex >= 0 && newIndex < this.filtered.length) {
        this.selected = newIndex;
      }
    }

    if (e.which === 13) { // ENTER
      const item = this.filtered[this.selected];
      if (!item) {
        return;
      }

      this.value = false;
      paletteEvents.emit('select', item.text);
    }
  }

  @Watch<Palette>('filtered')
  public resetSelected() {
    this.selected = 0;
  }

  @Watch<Palette>('value', { immediate: true })
  public resetSearch() {
    if (this.value) {
      window.addEventListener('keydown', this.checkEnterEsc);
      this.searchText = '';
    } else {
      window.removeEventListener('keydown', this.checkEnterEsc);
    }
  }

  @Watch<Palette>('selected', { immediate: true })
  public doAutomatic() {
    const item = this.filtered[this.selected];
    if (item) {
      paletteEvents.emit('focus', item.text);
    }
  }

  public render(h: CreateElement) {
    const search = h(TextField, {
      props: {
        value: this.searchText,
        autofocus: true,
        placeholder: this.placeholder,
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
      class: 'secondary', // sets the theme
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
      },
      on: {
        click: () => {
          paletteEvents.emit('cancel');
          this.value = false;
        },
      },
      class: 'foreground--text',
    }, children);
  }
}


