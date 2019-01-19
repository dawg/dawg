import { configure } from '@storybook/vue';
import storybook from '../../src/storybook';

storybook();

function loadStories() {
  // require('../../src/stories');
  require('../../src/modules/sequencer/sequencer.stories');
}

configure(loadStories, module);
