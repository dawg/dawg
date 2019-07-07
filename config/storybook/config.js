import { configure } from '@storybook/vue';
import storybook from '../../src/storybook';

storybook();

function loadStories() {
  // TODO REMOVE
}

configure(loadStories, module);
