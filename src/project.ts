import fs from '@/fs';
import Tone from 'tone';
import { findUniqueName, range } from '@/utils';
import * as Audio from '@/modules/audio';
import uuid from 'uuid';
import { loadBuffer, loadBufferSync } from '@/modules/wav/local';
import { makeLookup, chain } from '@/modules/utils';
import { Signal } from '@/modules/audio';
import * as t from 'io-ts';
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
import { EffectName } from '@/core/filters/effects';
import { Effect, AnyEffect } from '@/core/filters/effect';
import { Serializable } from '@/core/serializable';
import { FileLoader } from '@/core/loaders/file';
import { Error } from '@/core/loaders/loader';
import { Instrument } from '@/core/instrument/instrument';

const ProjectTypeRequired = t.type({
  id: t.string,
  bpm: t.number,
  name: t.string,
  master: PlaylistType,
  channels: t.array(ChannelType),
  tracks: t.array(TrackType),
});

const ProjectTypePartial = t.partial({
  stepsPerBeat: t.number,
  beatsPerMeasure: t.number,
  patterns: t.array(PatternType),
  instruments: t.array(t.union([SynthType, SoundfontType])),
  samples: t.array(SampleType),
  automationClips: t.array(AutomationType),
});

export const ProjectType = t.intersection([ProjectTypeRequired, ProjectTypePartial]);

export type IProject = t.TypeOf<typeof ProjectType>;

export interface IProjectConstructor {
  id: string;
  bpm: number;
  stepsPerBeat?: number;
  beatsPerMeasure?: number;
  name: string;
  patterns: Pattern[];
  instruments: Array<Synth | Soundfont>;
  channels: Channel[];
  tracks: Track[];
  samples: Sample[];
  automationClips: AutomationClip[];
  master: Playlist;
}

export interface ProjectLoaded {
  type: 'success';
  project: Project;
}

/**
 * This module represents the project. When a user saves the project, this file is serialized to the fs.
 */
export class Project implements Serializable<IProject> {
  public static newProject() {
    return new Project({
      id: uuid.v4(),
      bpm: 120,
      name: '',
      master: new Playlist([]),
      patterns: [Pattern.create('Pattern 0')],
      instruments: [Synth.create('Synth 0')],
      channels: range(10).map((index) => Channel.create(index)),
      tracks: range(21).map((index) => Track.create(index)),
      samples: [],
      automationClips: [],
    });
  }

  public static load(i: IProject) {
    const channels =  (i.channels || []).map((iChannel) => {
      return new Channel(iChannel);
    });

    const instruments = (i.instruments || []).map((iInstrument) => {
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
          return new Soundfont(Audio.Soundfont.load(iInstrument.soundfont), destination, iInstrument);
        case 'synth':
          return new Synth(destination, iInstrument);
      }
    });

    const samples = (i.samples || []).map((iSample) => {
      let buffer: AudioBuffer | null = null;
      if (fs.existsSync(iSample.path)) {
        buffer = loadBufferSync(iSample.path);
      }

      return new Sample(buffer, iSample);
    });

    const instrumentLookup = makeLookup(instruments);
    const channelLookup = makeLookup(channels);
    const tracks = i.tracks.map((iTrack) => new Track(iTrack));

    // I don't like this at all
    // But I can't think of a better way to serialize / deserialize automation clips
    // We should figure out how other DAWs serialize automation clips
    const automationClips = (i.automationClips || []).map((iAutomationClip) => {
      let signal: Signal;
      if (iAutomationClip.context === 'channel') {
        // FIXME(3) remove this
        // @ts-ignore
        signal = channelLookup[iAutomationClip.contextId][iAutomationClip.attr];
      } else {
        // @ts-ignore
        signal = instrumentLookup[iAutomationClip.contextId][iAutomationClip.attr];
      }

      if (!signal) {
        throw Error('Unable to parse automation clip');
      }

      return new AutomationClip(signal, iAutomationClip);
    });

    const patterns = (i.patterns || []).map((iPattern) => {
      const scores = (iPattern.scores || []).map((iScore) => {
        if (!(iScore.instrumentId in instrumentLookup)) {
          throw Error(`Instrument from score ${iScore.id} was not found in instrument list.`);
        }

        const instrument = instrumentLookup[iScore.instrumentId];
        return new Score(instrument, iScore);
      });

      const pattern = new Pattern(iPattern, scores);
      // Make sure we set the bpm because the transports will not remember
      pattern.transport.bpm.value = i.bpm;
      return pattern;
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
    master.transport.bpm.value = i.bpm;
    Tone.Transport.bpm.value = i.bpm;

    return new Project({
      ...i,
      stepsPerBeat: i.stepsPerBeat,
      beatsPerMeasure: i.beatsPerMeasure,
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
  public name: string;
  public id: string;
  public patterns: Pattern[];
  public instruments: Array<Synth | Soundfont>;
  public channels: Channel[];
  public tracks: Track[];
  public master: Playlist;
  public samples: Sample[];
  public automationClips: AutomationClip[];

  constructor(i: IProjectConstructor) {
    this.bpm = i.bpm;
    this.stepsPerBeat = i.stepsPerBeat || 4;
    this.beatsPerMeasure = i.beatsPerMeasure || 4;
    this.name = i.name;
    this.id = i.id;
    this.patterns = i.patterns;
    this.channels = i.channels;
    this.instruments = i.instruments;
    this.tracks = i.tracks;
    this.master = i.master;
    this.samples = i.samples;
    this.automationClips = i.automationClips;

  }

  public async save(path: string) {
    const encoded = this.serialize();
    await fs.writeFile(path, JSON.stringify(encoded, null, 4));
  }

  public setBpm(bpm: number) {
    this.bpm = bpm;
    // We have to keep all of the transports in sync
    // There must be a pattern for this
    // I want it to be reactive
    // Sub/pub ??
    // Also we shouldn't have to update the Transport bpm but we do
    this.master.transport.bpm.value = bpm;
    Tone.Transport.bpm.value = bpm;
    this.patterns.forEach((pattern) => {
      pattern.transport.bpm.value = bpm;
    });
  }

  public setName(name: string) {
    this.name = name;
  }

  public addPattern() {
    const name = findUniqueName(this.patterns, 'Pattern');
    const pattern = Pattern.create(name);
    // We also have to make sure new transports of the same bpm
    pattern.transport.bpm.value = this.bpm;
    this.patterns.push(pattern);
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

    // This isn' the best solution but it works
    // There must be a better pattern / object oriented way
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

    pattern.dispose();
    this.patterns.splice(i, 1);
  }

  public createAutomationClip<T extends Automatable>(
    payload: { automatable: T, key: keyof T & string, end: number, start: number },
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
    const clip = AutomationClip.create(length, signal, context, automatable.id, key);
    const placed = ScheduledAutomation.create(clip, payload.start, row);
    this.pushAutomationClip({ clip, placed });

    return true;
  }

  public pushAutomationClip(payload: { clip: AutomationClip, placed: ScheduledAutomation }) {
    this.automationClips.push(payload.clip);
    this.master.elements.push(payload.placed);
    payload.placed.schedule(this.master.transport);
  }

  public addScore(payload: { pattern: Pattern, instrument: Instrument<any, any>} ) {
    payload.pattern.scores.forEach((pattern) => {
      if (pattern.instrumentId === payload.instrument.id) {
        throw Error(`An score already exists for ${payload.instrument.id}`);
      }
    });

    payload.pattern.scores.push(Score.create(payload.instrument));
  }

  public addSample(payload: Sample) {
    if (this.samples.indexOf(payload) !== -1) {
      throw Error(`${payload.id} already exists`);
    }

    this.samples.push(payload);
  }

  get instrumentChannelLookup() {
    const lookup: { [k: number]: Array<Instrument<any, any>> } = {};
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
  public setChannel(payload: { instrument: Instrument<any, any>, channel?: number | null }) {
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

  public remoteAutomation(i: number) {
    if (i >= this.automationClips.length) {
      throw Error(`Unable to remove sample ${i}. Out of bounds.`);
    }

    const clip = this.automationClips[i];

    // This isn' the best solution but it works
    // There must be a better pattern / object oriented way
    this.master.elements = this.master.elements.filter((element) => {
      if (element.component !== 'automation-clip-element') {
        return true;
      }

      if (element.clip !== clip) {
        return true;
      }

      element.dispose();
      return false;
    });

    clip.dispose();
    this.automationClips.splice(i, 1);
  }

  public scheduleMaster(sample: Sample, row: number, time: number) {
    this.samples.push(sample);

    const scheduled = new ScheduledSample(sample, {
      type: 'sample',
      sampleId: sample.id,
      duration: sample.beats,
      row,
      time,
    });

    scheduled.schedule(this.master.transport);
    this.master.elements.push(scheduled);
  }

  get effectLookup() {
    const effects = this.channels.map((channel) => channel.effects);
    const iterable = chain(...effects);
    return makeLookup(iterable);
  }

  get channelLookup() {
    return makeLookup(this.channels);
  }

  public serialize() {
    return {
      id: this.id,
      bpm: this.bpm,
      stepsPerBeat: this.stepsPerBeat,
      beatsPerMeasure: this.beatsPerMeasure,
      name: this.name,
      patterns: this.patterns.map((pattern) => pattern.serialize()),
      instruments: this.instruments.map((instrument) => instrument.serialize()),
      channels: this.channels.map((channel) => channel.serialize()),
      tracks: this.tracks.map((track) => track.serialize()),
      samples: this.samples.map((sample) => sample.serialize()),
      automationClips: this.automationClips.map((clip) => clip.serialize()),
      master: this.master.serialize(),
    };
  }
}

