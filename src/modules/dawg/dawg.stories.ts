import Dawg from '@/modules/dawg/Dawg.vue';
import MiniScore from '@/modules/dawg/MiniScore.vue';
import { storiesOf } from '@storybook/vue';

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

storiesOf(MiniScore.name, module)
  .add('Standard', () => ({
    components: { Dawg, MiniScore },
    template: `
    <dawg>
      <mini-score :notes="notes" style="height: 50px; width: 400px"></mini-score>
    </dawg>
    `,
    data: () => ({
      notes: NOTES,
    }),
  }));
