/* eslint-disable import/no-extraneous-dependencies */
// noinspection NpmUsedModulesInstalled
import { configure } from '@storybook/vue';
import middleware from '../../src/middleware';

middleware();

function loadStories() {
  // eslint-disable-next-line global-require
  require('../../src/stories');
}

configure(loadStories, module);
