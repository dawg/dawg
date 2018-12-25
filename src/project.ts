import os from 'os';
import path from 'path';
import { Module, VuexModule, Mutation, Action, getModule } from 'vuex-module-decorators';
import { Project, Instrument } from './models';
import store from '@/store';

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
class ProjectModule extends VuexModule implements Project {
  public bpm = 128;
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
  public setBPM(bpm: number) { this.bpm = bpm; }

  // action 'incr' commits mutation 'increment' when done with return value as payload
  @Action
  public incr() {
    return this.setBPM(5);
  }

  @Mutation
  public setValue<T extends keyof this>(payload: {key: T, value: any}) {
    this[payload.key] = payload.value;
  }
}


export default getModule(ProjectModule);
