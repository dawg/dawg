// noinspection NpmUsedModulesInstalled
import { configure } from '@storybook/vue';
import middleware from '../../src/middleware';

middleware();

function loadStories() {
  require('../../src/stories');
}

configure(loadStories, module);
