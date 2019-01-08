import Vue from 'vue';
import Vuex from 'vuex';
import { Module, getModule } from 'vuex-module-decorators';
import { Setter } from '@/utils';
import Project from '@/store/project';
import General from '@/store/general';
import Cache from '@/store/cache';

Vue.use(Vuex);
const store = new Vuex.Store({});

const ProjectWithSetter = Setter(Project);

@Module({ dynamic: true, store, name: 'project' })
class ProjectModule extends ProjectWithSetter {}

@Module({ dynamic: true, store, name: 'cache' })
class CacheModule extends Cache {}

@Module({ dynamic: true, store, name: 'general' })
class GeneralModule extends General {}

export const project = getModule(ProjectModule);
export const cache = getModule(CacheModule);
export const general = getModule(GeneralModule);
export default store;
