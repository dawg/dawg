import Vue from 'vue';
import { storiesOf } from '@storybook/vue';
import Split from '@/index';

Vue.use(Split);


storiesOf('Split', module)
  .add('Horizontal', () => ({
    template: `
    <split direction="horizontal" resizable>
        <split :min-size="100">
            panel left
        </split>
        <split :min-size="100">
            panel center
        </split>
        <split :min-size="300">
            panel right
        </split>
    </split>
    `,
  }));
