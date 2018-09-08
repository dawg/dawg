/* eslint-disable import/no-extraneous-dependencies */
// noinspection NpmUsedModulesInstalled
import { configure } from '@storybook/vue';

function loadStories() {
  // eslint-disable-next-line global-require
  require('../../src/stories');
}

configure(loadStories, module);
