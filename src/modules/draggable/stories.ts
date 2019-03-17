import { storiesOf } from '@storybook/vue';
import Draggable from './index';
import Vue from 'vue';

Vue.use(Draggable);

storiesOf('Draggable', module)
  .add('with some emoji', () => ({
    template: `
    <drag-element
      cursor="all-scroll"
      @move="drag"
      :style="style"
    >
      <div style="padding: 20px; background: red">
        DRAG
      </div>
    </drag-element>
    `,
    data: () => ({
      x: 0,
      y: 0,
    }),
    methods: {
      drag(e: MouseEvent) {
        // @ts-ignore
        this.x += e.movementX;
        // @ts-ignore
        this.y += e.movementY;
      },
    },
    computed: {
      style() {
        return {
          position: 'absolute',
          // @ts-ignore
          left: `${this.x}px`,
          // @ts-ignore
          top: `${this.y}px`,
        };
      },
    },
  }));
