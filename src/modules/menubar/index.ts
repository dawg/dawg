import { Vue, Component, Prop } from 'vue-property-decorator';
import { CreateElement } from 'vue';

interface SubMenuItem {
  text: string;
  callback: () => void;
}

interface SubMenu {
  name: string;
  items: Array<SubMenuItem | null>;
}

export type Menu = SubMenu[];

@Component
export class Item extends Vue {
  public hover = false;

  get style() {
    return {
      padding: '2px 8px',
      userSelect: 'none',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      cursor: this.hover ? 'default' : undefined,
      background: this.hover ? 'rgba(255, 255, 255, 0.25)' : undefined,
    };
  }

  public render(h: CreateElement) {
    return h('div', {
      style: this.style,
      on: {
        mouseover: () => {
          this.hover = true;
        },
        mouseleave: () => {
          this.hover = false;
        },
      },
    }, this.$slots.default);
  }
}

@Component
export class IconItem extends Vue {
  @Prop({ type: String, required: true }) public icon!: string;
  @Prop({ type: String, required: true }) public event!: string;

  public render(h: CreateElement) {
    const icon = h('v-icon', {
      style: { color: '#aaa' },
      props: { small: true },
    }, this.icon);

    return h(Item, {
      nativeOn: {
        click: () => {
          this.$emit(this.event);
        },
      },
    }, [icon]);
  }
}

@Component
export class MenuItem extends Vue {
  @Prop({ type: Object, required: true }) public subMenu!: SubMenu;

  public render(h: CreateElement) {
    return h(Item, {
      nativeOn: {
        click: (e: MouseEvent) => {
          e.stopPropagation();
          this.$menu(this.$el.getBoundingClientRect(), this.subMenu.items);
        },
      },
    }, this.subMenu.name);
  }
}

@Component
export class MenuBar extends Vue {
  @Prop({ type: Array, required: true }) public menu!: Menu;
  @Prop({ type: String, default: '100%' }) public height!: string;
  @Prop({ type: Boolean, required: true }) public maximized!: boolean;

  get icons() {
    return [
      ['maximize', 'minimize'],
      this.maximized ? ['filter_none', 'restore'] : ['crop_din', 'maximize'],
      ['close', 'close'],
    ];
  }

  public render(h: CreateElement) {
    const submenus = this.menu.map((subMenu) => {
      return h(MenuItem, {
        props: {
          subMenu,
        },
      });
    });

    submenus.push(h('div', { style: { flex: '1' } }));

    this.icons.forEach(([icon, event]) => {
      submenus.push(h(IconItem, {
        props: { event, icon },
        on: this.$listeners, // Make sure to pass down listeners
      }));
    });

    return h('div', {
      style: {
        display: 'flex',
        height: this.height,
        alignItems: 'stretch',
      },
      class: 'secondary-lighten-3 foreground--text',
    }, submenus);
  }
}


export default {
  install(vue: any) {
    vue.component('MenuBar', MenuBar);
  },
};
