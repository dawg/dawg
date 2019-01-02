import os from 'os';
import path from 'path';
import { Module, VuexModule, Mutation, getModule } from 'vuex-module-decorators';
import { Project, Instrument, Pattern } from './models';
import store from '@/store';
import { MapFieldSetter } from './utils';

const instruments: {[k: string]: Instrument} = {
  0: {
    name: 'SYNTH',
    source: {
      type: 'sine',
      options: {
        volume: 0,
      },
      envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0.3,
        release: 1,
      },
    },
  },
};

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
          instrument: '0',
          notes: [
            {
              id: 44,
              time: 0,
              duration: 1,
            },
          ],
        },
      ],
    },
  ];
  public instruments = instruments;
  public folders = [
    path.join(os.homedir(), 'Desktop'),
  ];

  @Mutation
  public addFolder(folder: string) {
    this.folders.push(folder);
  }

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
