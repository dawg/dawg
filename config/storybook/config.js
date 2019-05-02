import { configure } from '@storybook/vue';
import storybook from '../../src/storybook';

storybook();

function loadStories() {
  require('../../src/modules/dawg/dawg.stories');
  require('../../src/modules/split/stories');
}

configure(loadStories, module);
