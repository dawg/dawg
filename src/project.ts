import os from 'os';
import path from 'path';
import { Module, VuexModule, Mutation, getModule } from 'vuex-module-decorators';
import { Project, Instrument, Pattern } from './models';
import store from '@/store';
import { MapFieldSetter } from './utils';

const ins: Instrument[] = [
  {
    name: 'SYNTH',
    type: 'sine',
    volume: 0,
    pan: 0,
  },
];

@Module({ dynamic: true, store, name: 'project' })
class ProjectModule extends VuexModule implements Project, MapFieldSetter {
  public bpm = 128;

  // TODO Remove defaults
  public patterns = [
    {
      name: 'TESTER',
      scores: [
        {
          name: 'TEST',
          instrument: 'SYNTH',
          notes: [
            {
              id: 44,
              time: 0,
              duration: 1,
            },
            {
              id: 42,
              time: 0,
              duration: 1,
            },
            {
              id: 47,
              time: 1,
              duration: 1,
            },
            {
              id: 45,
              time: 2,
              duration: 1,
            },
          ],
        },
      ],
    },
  ];
  public instruments = ins;

  @Mutation
  public setValue<V extends keyof this>(payload: { key: V, value: any }) {
    this[payload.key] = payload.value;
  }

  @Mutation
  public reset(payload: Project) {
    Object.assign(this, payload);
  }

  get patternLookup() {
    const patterns: {[k: string]: Pattern} = {};
    this.patterns.forEach((pattern) => {
      patterns[pattern.name] = pattern;
    });
    return patterns;
  }
}

export default getModule(ProjectModule);
