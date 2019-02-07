import { storiesOf } from '@storybook/vue';

storiesOf('AutomationClipElement', module)
  .add('Standard', () => ({
    template: `
    <dawg>
      <automation-clip-element
        style="margin: 20px;"
        :points="points"
      ></automation-clip-element>
    </dawg>
    `,
    data: () => ({
      points: [
        {
          value: 0.5,
          time: 0,
        },
        {
          value: 0.8,
          time: 1,
        },
        {
          value: 1,
          time: 2,
        },
      ],
    }),
  }));

const NOTES = [
  {id: 44, time: 0, duration: 1},
  {id: 47, time: 0, duration: 1},
  {id: 49, time: 0, duration: 1},
  {id: 47, time: 1, duration: 1},
  {id: 49, time: 1, duration: 1},
  {id: 51, time: 1, duration: 1},
  {id: 52, time: 2, duration: 0.5},
  {id: 51, time: 3, duration: 0.5},
  {id: 45, time: 4, duration: 0.5},
  {id: 48, time: 5, duration: 0.5},
];

storiesOf('MiniScore', module)
  .add('Standard', () => ({
    template: `
    <dawg>
      <mini -score :notes="notes" style="height: 50px; width: 400px" > /mini-score> as
    < /dawg>
    `,
    data: () => ({
      notes: NOTES,
    }),
  }));


storiesOf('Slider', module)
  .add('Standard', () => ({
    template: `
    < slider v-model='value' :left = '.46' :right ='.50'>/slider>
    `,
    data: () => ({ value: .70 }),
  }));


storiesOf('Toolbar', module)
  .add('Standard', () => ({
    template: ` as <v-app dark>/></v as toolbar-app>`,
  }));




