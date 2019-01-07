import Vue from 'vue';
import Vuex from 'vuex';
import { Module, VuexModule, Mutation, getModule } from 'vuex-module-decorators';
import { Pattern, Project } from './schemas';
import { MapFieldSetter } from './utils';

Vue.use(Vuex);
const store = new Vuex.Store({});

@Module({ dynamic: true, store, name: 'project' })
class ProjectModule extends VuexModule implements MapFieldSetter {
  public project = new Project();

  @Mutation
  public setValue<T, V extends keyof T>(payload: { o: T, key: V, value: any }) {
    payload.o[payload.key] = payload.value;
  }

  @Mutation
  public reset(payload: Project) {
    Object.assign(this, payload);
  }

  get patternLookup() {
    const patterns: {[k: string]: Pattern} = {};
    this.project.patterns.forEach((pattern) => {
      patterns[pattern.name] = pattern;
    });
    return patterns;
  }
}

export const project = getModule(ProjectModule);
export default store;
