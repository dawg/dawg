import { configure } from '@storybook/vue';
import storybook from '../../src/storybook';

storybook();

function loadStories() {
  // require('../../src/stories');
  // require('../../src/modules/sequencer/sequencer.stories');
  //node = { fs: 'empty'};
  require('../../src/modules/dawg/dawg.stories');
  require('../../src/modules/palette/palette.stories');
  require('../../src/modules/split/stories');
}

configure(loadStories, module);
