import { storiesOf } from '@storybook/vue';

const NOTES = [
  {row: 44, time: 0, duration: 1},
  {row: 47, time: 0, duration: 1},
  {row: 49, time: 0, duration: 1},
  {row: 47, time: 1, duration: 1},
  {row: 49, time: 1, duration: 1},
  {row: 51, time: 1, duration: 1},
  {row: 52, time: 2, duration: 0.5},
  {row: 51, time: 3, duration: 0.5},
  {row: 45, time: 4, duration: 0.5},
  {row: 48, time: 5, duration: 0.5},
];

storiesOf('MiniScore', module)
  .add('Standard', () => ({
    template: `
    <dawg>
      <mini-score :notes="notes" style="height: 50px; width: 400px"></mini-score>
    </dawg>
    `,
    data: () => ({
      notes: NOTES,
    }),
  }));


storiesOf('Slider', module)
  .add('Standard', () => ({
    template: `
    <slider v-model="value" :left=".46" :right =".50"></slider>
    `,
    data: () => ({ value: .70 }),
  }));


storiesOf('Toolbar', module)
  .add('Standard', () => ({
    template: `<v-app dark><toolbar></toolbar></v-app>`,
  }));




