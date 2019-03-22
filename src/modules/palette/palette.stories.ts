import Vue from 'vue';
import { storiesOf } from '@storybook/vue';
import Palette, { PaletteItem } from '@/modules/palette';

Vue.use(Palette);

const items: PaletteItem[] = [
  {
    text: 'One Command',
    callback: () => ({}),
    shortcut: ['Ctrl', 'S'],
  },
  {
    text: 'Two Command',
    callback: () => ({}),
  },
  {
    text: 'Three Command',
    callback: () => ({}),
  },
  {
    text: 'Four Command',
    callback: () => ({}),
  },
  {
    text: 'Five Command',
    callback: () => ({}),
  },
];

function open(e: KeyboardEvent) {
  if (e.which === 112) { // 112 == 'p'
    //
  }
}

storiesOf('Palette', module)
  .add('default', () => ({
    template: `
    <div>
      <button @click="active = true">ACTIVATE</button>
      <palette
        v-model="active"
        :items="items"
        palette-class="secondary"
      ></palette>
    </div>
    `,
    data: () => ({
      active: false,
      items,
    }),
    mounted() {
      window.addEventListener('keypress', open);
    },
    destroyed() {
      window.removeEventListener('keypress', open);
    },
  }));
