import Vue from 'vue';
import Vuex from 'vuex';
import { Module, getModule } from 'vuex-module-decorators';
import { Project } from './schemas';
import { Setter } from './utils';

Vue.use(Vuex);
const store = new Vuex.Store({});

const ProjectWithSetter = Setter(Project);

@Module({ dynamic: true, store, name: 'project' })
class ProjectModule extends ProjectWithSetter {}

export const project = getModule(ProjectModule);
export default store;
