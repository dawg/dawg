import { Vue, Component, Prop } from 'vue-property-decorator';
import { CreateElement } from 'vue';

interface SubMenuItem {
  text: string;
  callback: () => void;
}

interface SubMenu {
  name: string;
  items: SubMenuItem[];
}

export type Menu = SubMenu[];

@Component
export class MenuItem extends Vue {
  @Prop({ type: Object, required: true }) public subMenu!: SubMenu;

  public hover = false;

  get style() {
    return {
      padding: '2px 4px',
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
      on: {
        click: () => {
          this.$menu(this.$el.getBoundingClientRect(), this.subMenu.items);
        },
        mouseover: () => {
          this.hover = true;
        },
        mouseleave: () => {
          this.hover = false;
        },
      },
      style: this.style,
    }, this.subMenu.name);
  }
}

@Component
export class MenuBar extends Vue {
  @Prop({ type: Array, required: true }) public menu!: Menu;
  @Prop({ type: String, default: '100%' }) public height!: string;

  public render(h: CreateElement) {
    const submenus = this.menu.map((subMenu) => {
      return h(MenuItem, {
        props: {
          subMenu,
        },
      });
    });

    return h('div', {
      style: {
        display: 'flex',
        height: this.height,
        alignItems: 'stretch',
      },
      class: 'secondary-lighten-3 white--text',
    }, submenus);
  }
}


export default {
  install(vue: any) {
    vue.component('MenuBar', MenuBar);
  },
};
