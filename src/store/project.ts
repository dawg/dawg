import fs from 'fs';

import { autoserialize, autoserializeAs } from 'cerialize';
import { VuexModule, Mutation, Module, getModule, Action } from 'vuex-module-decorators';
import { Module as Mod } from 'vuex';
import { remote } from 'electron';

import { Pattern, Instrument, Score } from '@/schemas';
import { Setter } from '@/utils';
import store from '@/store/store';
import cache from '@/store/cache';
import io from '@/modules/io';

const { dialog } = remote;
const FILTERS = [{ name: 'DAWG Files', extensions: ['dg'] }];

export class Project extends VuexModule {
  @autoserialize public bpm = 128;
  @autoserializeAs(Pattern) public patterns: Pattern[] = [];
  @autoserializeAs(Instrument) public instruments: Instrument[] = [];

  constructor(module?: Mod<any, any>) {
    super(module || {});
  }

  @Action
  public save() {
    if (!cache.openedFile) {
      cache.setOpenedFile(dialog.showSaveDialog(remote.getCurrentWindow(), {}));
      // dialog.showSaveDialog can be null. Return type for showSaveDialog is wrong.
      if (!cache.openedFile) { return; }
      if (!cache.openedFile.endsWith('.dg')) {
        cache.setOpenedFile(cache.openedFile + '.dg');
      }
    }

    const encoded = io.serialize(this, Project);
    fs.writeFileSync(
      cache.openedFile,
      JSON.stringify(encoded, null, 4),
    );
  }

  @Action
  public open() {
    // files can be undefined. There is an issue with the .d.ts files.
    const files = dialog.showOpenDialog(
      remote.getCurrentWindow(),
      { filters: FILTERS, properties: ['openFile'] },
    );

    if (!files) {
      return;
    }

    const filePath = files[0];
    cache.setOpenedFile(filePath);
    this.load();
  }

  @Action
  public load() {
    if (!cache.openedFile) { return; }
    if (!fs.existsSync(cache.openedFile)) { return; }
    let contents = fs.readFileSync(cache.openedFile).toString();
    contents = JSON.parse(contents);
    const result = io.deserialize(contents, Project);
    this.reset(result);
  }

  @Mutation
  public reset(payload: Project) {
    Object.assign(this, payload);
  }

  @Mutation
  public addInstrument() {
    let name: string;
    let count = 0;
    while (true) {
      name = `Instrument ${count}`;
      let found = false;
      for (const instrument of this.instruments) {
        if (instrument.name === name) {
          found = true;
          break;
        }
      }

      if (!found) {
        break;
      }

      count++;
    }
    this.instruments.push(Instrument.default(name));
  }

  get patternLookup() {
    const patterns: {[k: string]: Pattern} = {};
    this.patterns.forEach((pattern) => {
      patterns[pattern.name] = pattern;
    });
    return patterns;
  }

  get instrumentLookup() {
    const instruments: {[k: string]: Instrument} = {};
    this.instruments.forEach((instrument) => {
      instruments[instrument.name] = instrument;
    });
    return instruments;
  }
}

const ProjectWithSetter = Setter(Project);

@Module({ dynamic: true, store, name: 'project' })
class ProjectModule extends ProjectWithSetter {}

export default getModule(ProjectModule);
