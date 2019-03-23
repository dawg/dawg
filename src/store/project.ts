import fs from 'mz/fs';
import { Component, Vue } from 'vue-property-decorator';
import Tone from 'tone';
import soundfonts from 'soundfont-player';
import * as io from '@/modules/cerialize';
import { Mutation, getModule, Action } from 'vuex-module-decorators';
import { remote } from 'electron';
import { findUniqueName, range, UnreachableCaseError } from '@/utils';
import * as Audio from '@/modules/audio';
import cache from '@/store/cache';
import general from '@/store/general';
import uuid from 'uuid';
import { loadBuffer } from '@/modules/wav/local';
import { makeLookup, chain } from '@/modules/utils';
import { Signal } from '@/modules/audio';
import backend from '@/backend';
import * as t from 'io-ts';
import { User } from 'firebase';
import { PatternType, Pattern } from '@/core/pattern';
import { SynthType, Synth } from '@/core/instrument/synth';
import { SoundfontType, Soundfont } from '@/core/instrument/soundfont';
import { ChannelType, Channel } from '@/core/channel';
import { TrackType, Track } from '@/core/track';
import { PlaylistType, Playlist } from '@/core/playlist';
import { SampleType, Sample } from '@/core/sample';
import { AutomationType, AutomationClip, ClipContext, Automatable } from '@/core/automation';
import { ScheduledAutomation } from '@/core/scheduled/automation';
import { ScheduledPattern } from '@/core/scheduled/pattern';
import { ScheduledSample } from '@/core/scheduled/sample';
import { Score } from '@/core/score';
import { EffectName, EffectOptions, EffectTones } from '@/core/filters/effects';
import { Effect, AnyEffect } from '@/core/filters/effect';

const { dialog } = remote;

const ProjectTypeRequired = t.type({
  id: t.string,
  bpm: t.number,
  master: PlaylistType,
});

const ProjectTypePartial = t.partial({
  stepsPerBeat: t.number,
  beatsPerMeasure: t.number,
  name: t.string,
  patterns: t.array(PatternType),
  instruments: t.array(t.union([SynthType, SoundfontType])),
  channels: t.array(ChannelType),
  tracks: t.array(TrackType),
  samples: t.array(SampleType),
  automationClips: t.array(AutomationType),
});

export const ProjectType = t.intersection([ProjectTypeRequired, ProjectTypePartial]);

export type IProject = t.TypeOf<typeof ProjectType>;

type Instrument = Synth | Soundfont;

export interface IProjectConstructor {
  id: string;
  bpm: number;
  stepsPerBeat: number;
  beatsPerMeasure: number;
  name: string;
  patterns: Pattern[];
  instruments: Instrument[];
  channels: Channel[];
  tracks: Track[];
  samples: Sample[];
  automationClips: AutomationClip[];
  master: Playlist;
}

/**
 * This module represents the project. When a user saves the project, this file is serialized to the fs.
 */
export class Project extends Vue {
  public static newProject() {
    return Project.load({
      id: uuid.v4(),
      bpm: 120,
      master: {},
    });
  }

  public static async load(i: IProject) {
    let channels: Channel[];
    if (i.channels) {
      channels = (i.channels || []).map((iChannel) => {
        return new Channel(iChannel);
      });
    } else {
      channels = range(10).map((index) => Channel.create(index));
    }

    const instruments = await Promise.all((i.instruments || []).map(async (iInstrument) => {
      let destination: Tone.AudioNode = Tone.Master;
      if (iInstrument.channel !== null && iInstrument.channel !== undefined) {
        if (iInstrument.channel >= channels.length) {
          throw Error(
            `Channel of instrument ${iInstrument.id} (${iInstrument.channel}) ` +
            `exceeds channel count ${channels.length}.`,
          );
        }

        const channel = channels[iInstrument.channel];
        destination = channel.input;
      }

      switch (iInstrument.instrument) {
        case 'soundfont':
          const context = Tone.context as unknown as AudioContext;
          const player = await soundfonts.instrument(context, name);
          const soundfont = new Audio.Soundfont(player);
          return new Soundfont(soundfont, destination, iInstrument);
        case 'synth':
          return new Synth(destination, iInstrument);
      }
    }));

    const samples = await Promise.all((i.samples || []).map(async (iSample) => {
      let buffer: AudioBuffer | null = null;
      if (await fs.exists(iSample.path)) {
        buffer = await loadBuffer(iSample.path);
      }

      return new Sample(buffer, iSample);
    }));

    let tracks: Track[];
    if (i.tracks) {
      tracks = i.tracks.map((iTrack) => new Track(iTrack));
    } else {
      tracks = range(21).map((index) => Track.create(index));
    }

    // I don't like this at all
    // But I can't think of a better way to serialize / deserialize automation clips
    // We should figure out how othinit(init(init(er DAWs serialize automation clips
    const automationClips = (i.automationClips || []).map((iAutomationClip) => {
      let signal: Signal;
      if (iAutomationClip.context === 'channel') {
        // TODO(jacob) remove this
        // @ts-ignore
        signal = this.channelLookup[clip.contextId][clip.attr];
      } else {
        // @ts-ignore
        signal = this.instrumentLookup[clip.contextId][clip.attr];
      }

      return new AutomationClip(signal, iAutomationClip);
    });

    const instrumentLookup = makeLookup(instruments);
    const patterns = (i.patterns || []).map((iPattern) => {
      const scores = (iPattern.scores || []).map((iScore) => {
        if (!(iScore.instrumentId in instrumentLookup)) {
          throw Error(`Instrument from score ${iScore.id} was not found in instrument list.`);
        }

        const instrument = instrumentLookup[iScore.instrumentId];
        return new Score(instrument, iScore);
      });

      return new Pattern(iPattern, scores);
    });

    const clipLookup = makeLookup(automationClips);
    const patternLookup = makeLookup(patterns);
    const sampleLookup = makeLookup(samples);

    const elements = (i.master.elements || []).map((iElement) => {
      switch (iElement.type) {
        case 'automation':
          if (!(iElement.automationId in clipLookup)) {
            throw Error(`An Automation clip from the Playlist was not found (${iElement.automationId}).`);
          }

          const clip = clipLookup[iElement.automationId];
          return new ScheduledAutomation(clip, iElement);
        case 'pattern':
          if (!(iElement.patternId in patternLookup)) {
            throw Error(`A Pattern from the Playlist was not found (${iElement.patternId}).`);
          }

          const pattern = patternLookup[iElement.patternId];
          return new ScheduledPattern(pattern, iElement);
        case 'sample':
          if (!(iElement.sampleId in sampleLookup)) {
            throw Error(`A Sample from the Playlist was not found (${iElement.sampleId}).`);
          }

          const sample = sampleLookup[iElement.sampleId];
          return new ScheduledSample(sample, iElement);
      }
    });
    const master = new Playlist(elements);

    return new Project({
      ...i,
      stepsPerBeat: i.stepsPerBeat || 4,
      beatsPerMeasure: i.beatsPerMeasure || 4,
      name,
      patterns,
      instruments,
      channels,
      tracks,
      samples,
      automationClips,
      master,
    });
  }

  public bpm: number;
  public stepsPerBeat: number;
  public beatsPerMeasure: number;
  public name: string | null;
  public id: string;
  public patterns: Pattern[];
  public instruments: Array<Synth | Soundfont> = [];
  public channels: Channel[];
  public tracks: Track[];
  public master: Playlist;
  public samples: Sample[];
  public automationClips: AutomationClip[];

  constructor(i: IProjectConstructor) {
    super();
    this.bpm = i.bpm;
    this.stepsPerBeat = i.stepsPerBeat;
    this.beatsPerMeasure = i.beatsPerMeasure;
    this.name = i.name;
    this.id = i.id;
    this.patterns = i.patterns;
    this.channels = i.channels;
    this.tracks = i.tracks;
    this.master = i.master;
    this.samples = i.samples;
    this.automationClips = i.automationClips;

  }

  public async save(opts: { backup: boolean, user: User | null, forceDialog?: boolean }) {
    let openedFile = general.openedFile;
    if (!openedFile || opts.forceDialog) {
      openedFile = dialog.showSaveDialog(remote.getCurrentWindow(), {}) || null;

      // If the user cancels the dialog
      if (!openedFile) {
        return;
      }

      cache.setOpenedFile(openedFile);

      // This should never be true but we need to check
      if (!cache.openedFile) {
        return;
      }

      if (!cache.openedFile.endsWith('.dg')) {
        cache.setOpenedFile(cache.openedFile + '.dg');
      }
    }

    const encoded = io.serialize(this, Project);

    fs.writeFileSync(
      openedFile,
      JSON.stringify(encoded, null, 4),
    );

    // I don't think this is the best place to put this.
    if (opts.backup && opts.user) {
      return await backend.updateProject(opts.user, this.id, encoded);
    }
  }

  public async load() {
    let reset = false;
    for (const path of [cache.backupTempPath, cache.openedFile]) {
      if (!path) {
        continue;
      }

      if (!await fs.exists(path)) {
        // tslint:disable-next-line:no-console
        console.warn(`${path} does not exist`);
        continue;
      }

      // tslint:disable-next-line:no-console
      console.info(`Loading from ${path}`);

      let contents = fs.readFileSync(path).toString();

      if (cache.backupTempPath === path) {
        // Always reset to null
        fs.unlink(path);
        cache.setBackupTempPath(null);
      } else {
        // This means that we are opening the cache file
        general.setOpenedFile(path);
      }

      contents = JSON.parse(contents);
      const result = io.deserialize(contents, Project);
      this.reset(result);
      reset = true;
      break;
    }

    if (cache.openedFile) {
      fs.exists(cache.openedFile, (_, exists) => {
        if (!exists) {
          cache.setOpenedFile(null);
        }
      });
    }

    if (!reset) {
      return;
    }
  }

  public reset(payload: Project) {
    Object.assign(this, payload);
  }

  public setOption<T extends EffectName, V extends keyof EffectOptions[T] & keyof EffectTones[T]>(
    payload: { effect: Effect<T>, key: V, value: EffectOptions[T][V] & EffectTones[T][V] },
  ) {
    payload.effect.options[payload.key] = payload.value;
    payload.effect.effect[payload.key] = payload.value;
  }

  public setBpm(bpm: number) {
    this.bpm = bpm;
  }

  public setName(name: string) {
    this.name = name;
  }

  public addPattern() {
    const name = findUniqueName(this.patterns, 'Pattern');
    this.patterns.push(Pattern.create(name));
  }

  public async addInstrument(type: 'Synth' | 'Soundfont') {
    const name = findUniqueName(this.instruments, type);

    if (type === 'Synth') {
      this.instruments.push(Synth.create(name));
    } else {
      this.instruments.push(await Soundfont.create('acoustic_grand_piano', name));
    }
  }

  public removeSample(i: number) {
    if (i >= this.samples.length) {
      throw Error(`Unable to remove sample ${i}. Out of bounds.`);
    }

    const sample = this.samples[i];

    // This isn' the best solution
    this.master.elements = this.master.elements.filter((element) => {
      if (!(element instanceof ScheduledSample)) {
        return true;
      }

      if (element.sample !== sample) {
        return true;
      }

      element.dispose();
      return false;
    });

    sample.dispose();
    this.samples.splice(i, 1);
  }

  public removePattern(i: number) {
    if (i >= this.patterns.length) {
      throw Error(`Unable to pattern sample ${i}. Out of bounds.`);
    }

    const pattern = this.patterns[i];

    this.master.elements = this.master.elements.filter((element) => {
      if (!(element instanceof ScheduledPattern)) {
        return true;
      }

      if (element.pattern !== pattern) {
        return true;
      }

      element.dispose();
      return false;
    });

    // TODO move to mutation
    pattern.dispose();
    this.patterns.splice(i, 1);
  }

  public createAutomationClip<T extends Automatable>(
    payload: { automatable: T, key: keyof T, end: number, start: number },
  ) {
    const { start, end, key, automatable } = payload;
    const signal = automatable[key] as any as Signal;


    const available: boolean[] = Array(this.tracks.length).fill(true);
    this.master.elements.forEach((element) => {
      if (
        start > element.time && start < element.time + element.duration ||
        end > element.time && end < element.time + element.duration
      ) {
        available[element.row] = false;
      }
    });

    let row: number | null = null;
    for (const [i, isAvailable] of available.entries()) {
      if (isAvailable) {
        row = i;
        break;
      }
    }

    // return project.createAutomationClip({
    //   start: this.masterStart,
    //   end: this.masterEnd,
    //   signal: currentValue,
    //   row: i,
    // });

    if (row === null) {
      return false;
    }

    let context: ClipContext;
    if (automatable instanceof Channel) {
      context = 'channel';
    } else {
      context = 'instrument';
    }

    const length = payload.end - payload.start;
    const clip = AutomationClip.create(length, signal, context, automatable.id);
    const placed = ScheduledAutomation.create(clip, payload.start, row, length);
    this.pushAutomationClip({ clip, placed });

    return true;
  }

  public pushAutomationClip(payload: { clip: AutomationClip, placed: ScheduledAutomation }) {
    this.automationClips.push(payload.clip);
    this.master.elements.push(payload.placed);
    payload.placed.schedule(this.master.transport);
  }

  public addScore(payload: { pattern: Pattern, instrument: Instrument} ) {
    payload.pattern.scores.forEach((pattern) => {
      if (pattern.instrumentId === payload.instrument.id) {
        throw Error(`An score already exists for ${payload.instrument.id}`);
      }
    });

    payload.pattern.scores.push(Score.create(payload.instrument));
  }

  public addSample(payload: Sample) {
    if (payload.id in this.sampleLookup) {
      throw Error(`${payload.id} already exists`);
    }

    this.pushSample(payload);
  }

  public pushSample(payload: Sample) {
    this.samples.push(payload);
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

  public deleteEffect(payload: { channel: Channel, effect: AnyEffect }) {
    // instruments could be undefined
    const instruments = this.instrumentChannelLookup[payload.channel.number] || [];

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

    // Instruments could be undefined if no instruments have been routed to this channel yet.
    const instruments = this.instrumentChannelLookup[payload.channel.number] || [];

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
        instrument.connect(newEffect.effect);
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

  public deleteInstrument(i: number) {
    const instrument = this.instruments[i];

    this.patterns.forEach((pattern) => {
      pattern.removeScores((score) => {
        return score.instrument === instrument;
      });
    });

    instrument.dispose();
    this.instruments.splice(i, 1);
  }

  /**
   * Sets the channel of the instrument to the given channel. If no channel is given, the instrument will be connected
   * to channel (useful for reconnecting to channel after re-initialization from the fs).
   */
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
    return makeLookup(this.patterns);
  }

  get sampleLookup() {
    return makeLookup(this.samples);
  }

  get instrumentLookup() {
    return makeLookup(this.instruments);
  }

  get automationLookup() {
    return makeLookup(this.automationClips);
  }

  get effectLookup() {
    const effects = this.channels.map((channel) => channel.effects);
    const iterable = chain(...effects);
    return makeLookup(iterable);
  }

  get channelLookup() {
    return makeLookup(this.channels);
  }
}

