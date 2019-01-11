import fs from 'mz/fs';

import { autoserialize, autoserializeAs } from 'cerialize';
import { VuexModule, Mutation, Module, getModule, Action } from 'vuex-module-decorators';
import { Module as Mod } from 'vuex';
import { remote } from 'electron';

import { Pattern, Instrument, Score, Note } from '@/schemas';
import { Setter, findUniqueName, toTickTime } from '@/utils';
import store from '@/store/store';
import cache from '@/store/cache';
import io from '@/modules/io';
import Vue from 'vue';
import uuid from 'uuid';

const { dialog } = remote;
const FILTERS = [{ name: 'DAWG Files', extensions: ['dg'] }];

@Module({ dynamic: true, store, name: 'project' })
export class Project extends VuexModule {
  @autoserialize public bpm = 128;
  @autoserialize public id = uuid.v4();
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
  public async open() {
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
    return this.load();
  }

  @Action
  public async load() {
    if (!cache.openedFile) { return; }
    if (!await fs.exists(cache.openedFile)) { return; }
    let contents = (await fs.readFile(cache.openedFile)).toString();
    contents = JSON.parse(contents);
    const result = io.deserialize(contents, Project);
    this.reset(result);

    // This initializes the parts.
    // Since the parts are not serialized, we need to re-add stuff.
    // Ideally, we wouldn't have to do this, but I don't have a solution right now.
    this.patterns.forEach((pattern) => {
      pattern.scores.forEach((score) => {
        const instrument = this.instrumentLookup[score.instrumentId];
        score.notes.forEach((note) => {
          this.addNote({ pattern, instrument, note });
        });
      });
    });
  }

  @Mutation
  public addNote(payload: { pattern: Pattern, instrument: Instrument, note: Note }) {
    const time = toTickTime(payload.note.time);
    // This is a bit messy... :(
    const callback = payload.instrument.callback.bind(payload.instrument);
    payload.pattern.part.add(callback, time, payload.note);
  }

  @Mutation
  public reset(payload: Project) {
    Object.assign(this, payload);
  }

  @Mutation
  public addPattern() {
    const name = findUniqueName(this.patterns, 'Pattern');
    this.patterns.push(Pattern.create(name));
  }

  @Mutation
  public addInstrument() {
    const name = findUniqueName(this.instruments, 'Instrument');
    this.instruments.push(Instrument.default(name));
  }

  @Mutation
  public addScore(payload: { pattern: Pattern, instrument: Instrument} ) {
    payload.pattern.scores.forEach((pattern) => {
      if (pattern.instrumentId === payload.instrument.id) {
        throw Error(`An score already exists for ${payload.instrument.id}`);
      }
    });

    payload.pattern.scores.push(Score.create(payload.instrument.id));
  }

  @Mutation
  public deleteInstrument(i: number) {
    Vue.delete(this.instruments, i);
  }

  get patternLookup() {
    const patterns: {[k: string]: Pattern} = {};
    this.patterns.forEach((pattern) => {
      patterns[pattern.id] = pattern;
    });
    return patterns;
  }

  get instrumentLookup() {
    const instruments: {[k: string]: Instrument} = {};
    this.instruments.forEach((instrument) => {
      instruments[instrument.id] = instrument;
    });
    return instruments;
  }
}

export default getModule(Setter(Project));
