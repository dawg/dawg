import Vue from 'vue';
import { storiesOf } from '@storybook/vue';
import Split from '@/index';

Vue.use(Split);


storiesOf('Split', module)
  .add('Horizontal', () => ({
    template: `
    <split direction="horizontal" resizable>
      <split :min-size="100" style="background: grey">
        panel left
      </split>
      <split :min-size="100" style="background: grey">
        panel center
        <div slot="gutter" :style="style"></div>
      </split>
      <split :min-size="100" style="background: grey">
        panel right
        <div slot="gutter" :style="style"></div>
      </split>
    </split>
    `,
    data: () => ({
      style: {
        height: '100%',
        width: '2px',
        background: 'black',
      },
    }),
  }))
  .add('collapsible', () => ({
    template: `
    <split direction="horizontal" resizable>
      <split :min-size="100" style="background: grey" collapsible>
      </split>
      <split :min-size="100" style="background: grey">
        <div slot="gutter" :style="style"></div>
      </split>
    </split>
    `,
    data: () => ({
      style: {
        height: '100%',
        width: '40%',
        background: 'black',
      },
    }),
  }));
