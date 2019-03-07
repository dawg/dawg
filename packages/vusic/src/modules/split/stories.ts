import Vue from 'vue';
import { storiesOf } from '@storybook/vue';
import Split from './index';

Vue.use(Split);


storiesOf('Split', module)
  .add('horizontal', () => ({
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
  .add('vertical', () => ({
    template: `
    <split direction="vertical" resizable>
      <split :min-size="100" style="background: grey">
        panel top
      </split>
      <split :min-size="100" style="background: grey">
        panel center
        <div slot="gutter" :style="style"></div>
      </split>
      <split :min-size="100" style="background: grey">
        panel bottom
        <div slot="gutter" :style="style"></div>
      </split>
    </split>
    `,
    data: () => ({
      style: {
        height: '2px',
        width: '100%',
        background: 'black',
      },
    }),
  }))
  .add('collapsible', () => ({
    template: `
    <split direction="horizontal" resizable>
      <split :min-size="100" style="background: grey" collapsible>
        left
      </split>
      <split :min-size="100" style="background: grey" collapsible>
        center
        <div slot="gutter" :style="style"></div>
      </split>
      <!-- <split :min-size="100" style="background: grey">
        right
        <div slot="gutter" :style="style"></div>
      </split> -->
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
