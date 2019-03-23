import fs from 'mz/fs';
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
import { AutomationType, AutomationClip } from '@/core/automation';
import { ScheduledAutomation } from '@/core/scheduled/automation';
import { ScheduledPattern } from '@/core/scheduled/pattern';
import { ScheduledSample } from '@/core/scheduled/sample';

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

/**
 * This module represents the project. When a user saves the project, this file is serialized to the fs.
 */
export class Project {
  public static newProject() {
    return new Project({
      id: uuid.v4(),
      bpm: 120,
      master: {},
    });
  }

  public static async load(i: IProject) {
    const instruments = await (i.instruments || []).map(async (iInstrument) => {
      switch (iInstrument.instrument) {
        case 'soundfont':
          const context = Tone.context as unknown as AudioContext;
          const player = await soundfonts.instrument(context, name);
          const soundfont = new Audio.Soundfont(player);
          return new Soundfont(soundfont, iInstrument);
        case 'synth':
          return new Synth(iInstrument);
      }
    });

    const samples = (i.samples || []).map(async (iSample) => {
      const buffer = await loadBuffer(iSample.path);
      return new Sample(buffer, iSample);
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

  constructor(i: IProject) {
    this.bpm = i.bpm;
    this.stepsPerBeat = i.stepsPerBeat || 4;
    this.beatsPerMeasure = i.beatsPerMeasure || 4;
    this.name = i.name || null;
    this.id = i.id;

    if (i.channels) {
      this.channels = (i.channels || []).map((iChannel) => {
        return new Channel(iChannel);
      });
    } else {
      this.channels = range(10).map((index) => Channel.create(index));
    }

    if (i.tracks) {
      this.tracks = i.tracks.map((iTrack) => new Track(iTrack));
    } else {
      this.tracks = range(21).map((index) => Track.create(index));
    }

    // I don't like this at all
    // But I can't think of a better way to serialize / deserialize automation clips
    // We should figure out how othinit(init(init(er DAWs serialize automation clips
    this.automationClips = (i.automationClips || []).map((iAutomationClip) => {
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

    const elements = (i.master.elements || []).map((iElement) => {
      switch (iElement.type) {
        case 'automation':
          return new ScheduledAutomation(clip, iElement);
        case 'pattern':
          return new ScheduledPattern(pattern, iElement);
        case 'sample':
          return new ScheduledSample(sample, iElement);
      }
    });
    this.master = new Playlist(elements);

    this.patterns = (i.patterns || []).map((iPattern) => {
      // iPattern.removeScores((score) => {
      //   return !(score.instrumentId in this.instrumentLookup);
      // });
      // pattern.scores.forEach((score) => {
      //   const instrument = this.instrumentLookup[score.instrumentId];
      //   score.init(instrument);
      //   score.notes.forEach((note) => {
      //     note.init(score.instrument);
      //     note.schedule(pattern.transport);
      //   });
      // });

      (iPattern.scores || []).map((iScore) => {
        if (iScore.instrumentId) {

        return new Score(iScore);
        }
      });

      return new Pattern(iPattern);
    });
  }

  @Action
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

  @Action
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

    this.samples.forEach((sample, i) => {
      let buffer: AudioBuffer | null = null;
      if (!fs.existsSync(sample.path)) {
        buffer = null;
      } else {
        buffer = loadBuffer(sample.path);
      }

      sample.init(buffer);
    });

    // This initializes the parts.
    // Since the parts are not serialized, we need to re-add stuff.
    // Ideally, we wouldn't have to do this, but I don't have a solution right now.
    this.patterns.forEach((pattern) => {
      pattern.removeScores((score) => {
        return !(score.instrumentId in this.instrumentLookup);
      });

      pattern.scores.forEach((score) => {
        const instrument = this.instrumentLookup[score.instrumentId];
        score.init(instrument);
        score.notes.forEach((note) => {
          note.init(score.instrument);
          note.schedule(pattern.transport);
        });
      });
    });

    // Same thing with the mixer.
    // Reconnect all of the channels
    this.channels.forEach((channel) => {
      channel.init();
    });

    // Reconnect the instruments to their channels
    this.instruments.forEach((instrument) => {
      this.setChannel({ instrument });
    });

    // I don't like this at all
    // But I can't think of a better way to serialize / deserialize automation clips
    // We should figure out how othinit(init(init(er DAWs serialize automation clips
    this.automationClips.forEach((clip) => {
      let signal: Signal;
      if (clip.context === 'channel') {
        // @ts-ignore
        signal = this.channelLookup[clip.contextId][clip.attr];
      } else {
        // @ts-ignore
        signal = this.instrumentLookup[clip.contextId][clip.attr];
      }

      if (!signal) {
        throw Error(`Unable to deserialize automation clip: ${clip.context} -> ${clip.contextId} -> ${clip.attr}`);
      }

      clip.init(signal);
    });

    this.master.elements.forEach((element) => {
      if (element instanceof PlacedPattern) {
        element.init(this.patternLookup[element.patternId]);
      } else if (element instanceof PlacedSample) {
        element.init(this.sampleLookup[element.sampleId]);
      } else if (element instanceof PlacedAutomationClip) {
        element.init(this.automationLookup[element.automationId]);
      }
    });

    // Init the master after all of the elements
    // have been initialized
    this.master.init();
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
  public setName(name: string) {
    this.name = name;
  }

  @Mutation
  public addPattern() {
    const name = findUniqueName(this.patterns, 'Pattern');
    this.patterns.push(Pattern.create(name));
  }

  @Mutation
  public addInstrument(type: 'Synth' | 'Soundfont') {
    const name = findUniqueName(this.instruments, type);

    this.instruments.push(Instrument.default(name));
  }

  @Action
  public removeSample(i: number) {
    // TODO move to mutation
    const sample = this.samples[i];

    // This isn' the best solution
    this.master.elements = this.master.elements.filter((element) => {
      if (!(element instanceof PlacedSample)) {
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

  @Action
  public removePattern(i: number) {
    const pattern = this.patterns[i];

    this.master.elements = this.master.elements.filter((element) => {
      if (!(element instanceof PlacedPattern)) {
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

  @Action
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
    const placed = PlacedAutomationClip.create(clip, payload.start, row, length);
    this.pushAutomationClip({ clip, placed });

    return true;
  }

  @Mutation
  public pushAutomationClip(payload: { clip: AutomationClip, placed: PlacedAutomationClip }) {
    this.automationClips.push(payload.clip);
    this.master.elements.push(payload.placed);
    payload.placed.schedule(this.master.transport);
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

  @Action
  public addSample(payload: Sample) {
    if (payload.id in this.sampleLookup) {
      throw Error(`${payload.id} already exists`);
    }

    this.pushSample(payload);
  }

  @Mutation
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

  @Action
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
    return makeLookup(this.patterns, (pattern) => pattern.id);
  }

  get sampleLookup() {
    return makeLookup(this.samples, (sample) => sample.id);
  }

  get instrumentLookup() {
    return makeLookup(this.instruments, (instrument) => instrument.id);
  }

  get automationLookup() {
    return makeLookup(this.automationClips, (clip) => clip.id);
  }

  get effectLookup() {
    const effects = this.channels.map((channel) => channel.effects);
    const iterable = chain(...effects);
    return makeLookup(iterable, (effect) => effect.id);
  }

  get channelLookup() {
    return makeLookup(this.channels, (channel) => channel.id);
  }
}

export default getModule(Project);
