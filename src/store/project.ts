import fs from 'mz/fs';
import Tone from 'tone';
import { autoserialize, autoserializeAs } from 'cerialize';
import { VuexModule, Mutation, Module, getModule, Action } from 'vuex-module-decorators';
import { Module as Mod } from 'vuex';
import { remote } from 'electron';

import {
  Pattern,
  Instrument,
  Score,
  Note,
  Channel,
  EffectName,
  Effect,
  AnyEffect,
  EffectOptions,
  EffectTones,
  Track,
} from '@/schemas';
import { findUniqueName, toTickTime, range } from '@/utils';
import store from '@/store/store';
import cache from '@/store/cache';
import io from '@/modules/io';
import Vue from 'vue';
import uuid from 'uuid';

const { dialog } = remote;
const FILTERS = [{ name: 'DAWG Files', extensions: ['dg'] }];

/**
 * This module represents the project. When a user saves the project, this file is serialized to the fs.
 */
@Module({ dynamic: true, store, name: 'project' })
export class Project extends VuexModule {
  @autoserialize public bpm = 128;
  @autoserialize public id = uuid.v4();
  @autoserializeAs(Pattern) public patterns: Pattern[] = [];
  @autoserializeAs(Instrument) public instruments: Instrument[] = [];
  @autoserializeAs(Channel) public channels = range(10).map((i) => Channel.create(i));
  @autoserializeAs(Track) public tracks = range(21).map((i) => Track.create(i));

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
        score.init(this.instrumentLookup);
        const instrument = this.instrumentLookup[score.instrumentId];
        score.notes.forEach((note) => {
          note.init(score.instrument);
          this.addNote({ pattern, instrument, note });
        });
      });
    });

    // Same thing with the mixer.
    // Reconnect all of the channels
    this.channels.forEach((channel) => {
      const effects = channel.effects;
      effects.forEach((effect) => effect.init());

      if (effects.length === 0) {
        return;
      }

      for (const [i, effect] of effects.slice(1).entries()) {
        effects[i - 1].connect(effect);
      }

      effects[effects.length - 1].connect(channel.destination);
    });

    // Reconnect the instruments to their channels
    this.instruments.forEach((instrument) => {
      this.setChannel({ instrument });
    });
  }

  @Mutation
  public addNote(payload: { pattern: Pattern, instrument: Instrument, note: Note }) {
    const time = toTickTime(payload.note.time);
    // TODO(jacob) This is a bit messy... :(
    payload.pattern.part.add(payload.note.callback, time, payload.note);
  }

  @Mutation
  public reset(payload: Project) {
    Object.assign(this, payload);
  }

  @Mutation
  public setOption<T extends EffectName, V extends keyof EffectOptions[T] & keyof EffectTones[T]>(
    payload: { effect: Effect<T>, key: V, value: EffectOptions[T][V] & EffectTones[T][V] },
  ) {
    payload.effect.options[payload.key] = payload.value;
    payload.effect.effect[payload.key] = payload.value;
  }

  @Mutation
  public setBpm(bpm: number) {
    this.bpm = bpm;
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

    payload.pattern.scores.push(Score.create(payload.instrument));
  }

  get instrumentChannelLookup() {
    const lookup: { [k: number]: Instrument[] } = {};
    this.instruments.forEach((instrument) => {
      if (instrument.channel !== null) {
        if (!(instrument.channel in lookup)) {
          lookup[instrument.channel] = [];
        }

        lookup[instrument.channel].push(instrument);
      }
    });
    return lookup;
  }

  @Action
  public deleteEffect(payload: { channel: Channel, effect: AnyEffect }) {
    const instruments = this.instrumentChannelLookup[payload.channel.number];
    const effects = payload.channel.effects;
    for (const [i, effect] of effects.entries()) {
      if (effect.slot !== payload.effect.slot) { continue; }
      const destination = (effects[i + 1] || {}).effect || payload.channel.destination;
      if (i === 0) {
        instruments.forEach((instrument) => {
          instrument.disconnect();
          instrument.connect(destination);
        });
      } else {
        effects[i - 1].disconnect();
        effects[i - 1].connect(destination);
      }

      effects.splice(i, 1);
      return;
    }

    throw Error(`Unable to delete effect ${payload.effect.slot} from channel ${payload.channel.number}`);
  }

  @Action
  public addEffect(payload: { channel: Channel, effect: EffectName, index: number } ) {
    const effects = payload.channel.effects;
    let toInsert: null | number = null;
    for (const [index, effect] of effects.entries()) {
      if (effect.slot === payload.index) {
        throw Error(`There already exists an effect in ${effect.slot}`);
      }

      if (effect.slot > payload.index) {
        toInsert = index;
        break;
      }
    }

    const instruments = this.instrumentChannelLookup[payload.channel.number];

    // Instruments could be undefined if no instruments have been routed to this channel yet.
    if (!instruments) {
      return;
    }


    let destination: Tone.AudioNode;
    let i: number;
    const newEffect = Effect.create(payload.index, payload.effect);
    if (toInsert === null) {
      destination = payload.channel.destination;
      i = effects.length;
    } else {
      destination = effects[toInsert].effect;
      i = toInsert;
    }

    newEffect.connect(destination);
    if (i === 0) {
      instruments.forEach((instrument) => {
        instrument.disconnect();
        instrument.connect(newEffect);
      });
    } else {
      effects[i - 1].disconnect();
      effects[i - 1].connect(newEffect);
    }

    // TODO Move to mutation
    if (toInsert !== null) {
      effects.splice(toInsert, 0, newEffect);
    } else {
      toInsert = effects.length;
      effects.push(newEffect);
    }
  }

  @Mutation
  public deleteInstrument(i: number) {
    // TODO We may need to disconnect the node.
    Vue.delete(this.instruments, i);
  }

  /**
   * Sets the channel of the instrument to the given channel. If no channel is given, the instrument will be connected
   * to channel (useful for reconnecting to channel after re-initialization from the fs).
   */
  @Mutation
  public setChannel(payload: { instrument: Instrument, channel?: number | null }) {
    const instrument = payload.instrument;
    let channel = payload.channel;
    if (instrument.channel === channel) {
      return;
    }

    if (channel === undefined) {
      channel = instrument.channel;
    }

    instrument.channel = channel;
    instrument.disconnect();


    let destination: Tone.AudioNode;
    if (channel === null) {
      destination = Tone.Master;
    } else {
      const c = this.channels[channel];
      destination = c.effects.length ? c.effects[0].effect : c.destination;
    }

    instrument.connect(destination);
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

export default getModule(Project);
