import * as t from '@/lib/io';
import * as oly from '@/olyger';
import {
  SynthType,
  SoundfontType,
  Soundfont,
  Synth,
  PatternType,
  Score,
  Pattern,
  Instrument,
  Sample,
  SampleType,
  PlaylistType,
  AutomationClip,
  AutomationType,
  TrackType,
  Channel,
  Track,
  ChannelType,
  createAutomationPrototype,
  createPatternPrototype,
  createSamplePrototype,
  Playlist,
  AnyEffect,
  PlaylistElementLookup,
  PlaylistElementType,
  Automatable,
  ClipContext,
} from '@/models';
import Tone from 'tone';
import * as Audio from '@/lib/audio';
import { findUniqueName } from '@/utils';
import { makeLookup, reverse } from '@/lib/std';
import fs from '@/lib/fs';
import { loadBufferSync } from '@/lib/wav';
import { notify } from '@/core/notify';
import { getLogger } from '@/lib/log';
import { computed } from '@vue/composition-api';
import { GraphNode, masterNode } from '@/node';

const logger = getLogger('project', { level: 'debug' });

// Chaining Examples
// If I delete an instrument, I need to delete the scores
// If I delete a pattern, I need to delete the pattern elements
// If I delete a sample, I need to delete the sample elements
// If I delete an automation clip, I need to delete the automation clip elements

// Chaining Principles
// 1. I only need to worry about my action (ie. how to execute AND undo my action)
// 2. Chains define dependencies and work off a simple API (ie. changed, added, removed)
// 3. Any chain reactions will be encompassed into a single action (ie. only a single undo/redo for the whole chain)

const ProjectTypeRequired = t.type({
  id: t.string,
  bpm: t.number,
  name: t.string,
  instruments: t.array(t.union([SynthType, SoundfontType])),
  patterns: t.array(PatternType),
  samples: t.array(SampleType),
  master: PlaylistType,
  automationClips: t.array(AutomationType),
  channels: t.array(ChannelType),
  tracks: t.array(TrackType),
});

const ProjectTypePartial = t.partial({
  stepsPerBeat: t.number,
  beatsPerMeasure: t.number,
});

const ProjectType = t.intersection([ProjectTypeRequired, ProjectTypePartial]);

type IProject = t.TypeOf<typeof ProjectType>;

export const createProject = (i: IProject) => {
  logger.info('Initiate loading of the project!');

  // TODO do we want to so this?
  Audio.Context.BPM = i.bpm;

  const channels =  oly.olyArr(i.channels.map((iChannel) => {
    return new Channel(iChannel);
  }));

  const instruments = oly.olyArr(i.instruments.map((iInstrument) => {
    const destination: Tone.AudioNode = Tone.Master;
    // if (iInstrument.channel !== null && iInstrument.channel !== undefined) {
    //   if (iInstrument.channel >= channels.length) {
    //     throw Error(
    //       `Channel of instrument ${iInstrument.id} (${iInstrument.channel}) ` +
    //       `exceeds channel count ${channels.length}.`,
    //     );
    //   }

    //   const channel = channels[iInstrument.channel];
    //   destination = channel.input;
    // }

    switch (iInstrument.instrument) {
      case 'soundfont':
        return new Soundfont(Audio.Soundfont.load(iInstrument.soundfont), destination, iInstrument);
      case 'synth':
        return new Synth(destination, iInstrument);
    }
  }));

  // TODO trigger non lazy
  instruments.onDidAdd(({ items }) => {
    items.forEach((instrument) => {
      instrument.channel.onDidChange((channel) => {
        let destination: GraphNode;
        if (channel === undefined) {
          destination = masterNode;
        } else {
          const c = channels[channel];
          destination = c.effects.length ? c.effects[0].effect : c.destination;
        }

        instrument.connect(destination);

        const currentChannel = instrument.channel;
        const currentDestination = instrument.destination;
        history.execute({
          execute: () => {
            instrument.channel = channel;
            instrument.disconnect();
            instrument.connect(destination);
          },
          undo: () => {
            if (!currentDestination) { return; }
            instrument.channel = currentChannel;
            instrument.disconnect();
            instrument.connect(currentDestination);
          },
        });
      });
    });
  });

  // TODO notify
  const errors: Array<{ title: string, message?: string }> = [];

  const instrumentLookup = makeLookup(instruments);
  const channelLookup = makeLookup(channels);
  const tracks = oly.olyArr(i.tracks.map((iTrack) => new Track(iTrack)));

  const patterns = oly.olyArr(i.patterns.map((iPattern) => {
    const transport = new Audio.Transport();
    const scores = iPattern.scores.map((iScore) => {
      if (!(iScore.instrumentId in instrumentLookup)) {
        errors.push({ title: `Instrument from score ${iScore.id} was not found in instrument list.` });
      }

      const instrument = instrumentLookup[iScore.instrumentId];
      return new Score(transport, instrument, iScore);
    });

    const pattern = new Pattern(iPattern, transport, scores);
    return pattern;
  }));

  const notFound: string[] = [];
  const samples = oly.olyArr(i.samples.map((iSample) => {
    let buffer: AudioBuffer | null = null;
    if (fs.existsSync(iSample.path)) {
      buffer = loadBufferSync(iSample.path);
    } else {
      notFound.push(iSample.path);
    }

    return new Sample(buffer, iSample);
  }));

  const automationClips = oly.olyArr(i.automationClips.map((iAutomationClip) => {
    let signal: Audio.Signal;
    if (iAutomationClip.context === 'channel') {
      // FIXME(3) remove this
      signal = (channelLookup[iAutomationClip.contextId] as any)[iAutomationClip.attr];
    } else {
      signal = (instrumentLookup[iAutomationClip.contextId] as any)[iAutomationClip.attr];
    }

    if (!signal) {
      throw Error('Unable to parse automation clip');
    }

    return new AutomationClip(signal, iAutomationClip);
  }));

  const clipLookup = makeLookup(automationClips);
  const patternLookup = makeLookup(patterns);
  const sampleLookup = makeLookup(samples);

  const mTransport = new Audio.Transport(); // master transport
  const elements = oly.olyArr(i.master.elements.map((iElement) => {
    switch (iElement.type) {
      case 'automation':
        if (!(iElement.id in clipLookup)) {
          throw Error(`An Automation clip from the Playlist was not found (${iElement.id}).`);
        }

        const clip = clipLookup[iElement.id];
        return createAutomationPrototype(iElement, clip, {})(mTransport).copy();
      case 'pattern':
        if (!(iElement.id in patternLookup)) {
          throw Error(`A Pattern from the Playlist was not found (${iElement.id}).`);
        }

        const pattern = patternLookup[iElement.id];
        return createPatternPrototype(iElement, pattern, {})(mTransport).copy();
      case 'sample':
        if (!(iElement.id in sampleLookup)) {
          throw Error(`A sample from the Playlist was not found (${iElement.id}).`);
        }

        const sample = sampleLookup[iElement.id];
        return createSamplePrototype(iElement, sample, {})(mTransport).copy();
    }
  }));

  const master = new Playlist(mTransport, elements);

  if (notFound.length !== 0) {
    errors.push({
      title: `Audio files not found`,
      message: notFound.join('\n'),
    });
  }

  instruments.onDidRemove(({ items: deletedInstruments }) => {
    const instrumentSet = new Set<Instrument<any, any>>(deletedInstruments);

    patterns.forEach((pattern) => {
      const toRemove: number[] = [];
      pattern.scores.forEach((score, ind) => {
        if (instrumentSet.has(score.instrument)) {
          toRemove.push(ind);
        }
      });

      for (const ind of reverse(toRemove)) {
        // TODO scores is not olyArr and scores need to be disposed
        // ie. removed.forEach(({ score }) => score.dispose());
        pattern.scores.splice(ind, 1);
      }
    });
  });

  const removeElements = <T extends PlaylistElementType>(
    type: T,
    removed: Array<PlaylistElementLookup[T]['element']>,
  ) => {
    const set = new Set(removed);
    const toRemove: number[] = [];
    master.elements.l.forEach((el, ind) => {
      if (el.type === type && set.has(el.element)) {
        toRemove.push(ind);
      }
    });

    for (const ind of reverse(toRemove)) {
      master.elements.l.splice(ind, 1);
    }
  };

  samples.onDidRemove(({ items: removedSamples }) => {
    removeElements('sample', removedSamples);
  });

  patterns.onDidRemove(({ items: removedPatterns }) => {
    removeElements('pattern', removedPatterns);
  });

  automationClips.onDidRemove(({ items: removedAutomation }) => {
    removeElements('automation', removedAutomation);
  });

  const serialize = (): IProject => {
    return {
      id: project.id,
      bpm: project.bpm.v,
      name: project.name.v,
      stepsPerBeat: project.stepsPerBeat.v,
      beatsPerMeasure: project.beatsPerMeasure.v,
      patterns: patterns.map((pattern) => pattern.serialize()),
      instruments: instruments.map((instrument) => instrument.serialize()),
      channels: channels.map((channel) => channel.serialize()),
      tracks: tracks.map((track) => track.serialize()),
      samples: samples.map((sample) => sample.serialize()),
      automationClips: automationClips.map((clip) => clip.serialize()),
      master: master.serialize(),
    };
  };

  const addInstrument = async (type: 'Synth' | 'Soundfont') => {
    const name = findUniqueName(project.instruments, type);
    const instrument = type === 'Soundfont' ?
      await Soundfont.create('acoustic_grand_piano', name) :
      Synth.create(name);

    instruments.push(instrument);
  };

  const deleteInstrument = (ind: number) => {
    instruments.splice(ind, 1);
  };

  async function save(path: string) {
    const encoded = serialize();
    await fs.writeFile(path, JSON.stringify(encoded, null, 4));
  }

  function createAutomationClip<T extends Automatable>(
    payload: { automatable: T, key: keyof T & string, end: number, start: number },
  ) {
    const { start, end, key, automatable } = payload;
    const signal = automatable[key] as any as Audio.Signal;

    const available: boolean[] = Array(tracks.length).fill(true);
    master.elements.l.forEach((element) => {
      if (
        start > element.time.value && start < element.time.value + element.duration.value ||
        end > element.time.value && end < element.time.value + element.duration.value
      ) {
        available[element.row.value] = false;
      }
    });

    let row: number | null = null;
    for (const [ind, isAvailable] of available.entries()) {
      if (isAvailable) {
        row = ind;
        break;
      }
    }

    if (row === null) {
      notify.warning('Unable to create automation clip', {
        detail: 'There are no free tracks. Move elements and try again.',
      });

      return;
    }

    let context: ClipContext;
    if (automatable instanceof Channel) {
      context = 'channel';
    } else {
      context = 'instrument';
    }

    const length = payload.end - payload.start;
    const clip = AutomationClip.create(length, signal, context, automatable.id, key);
    const placed = createAutomationPrototype(
      { time: payload.start, row, duration: clip.duration },
      clip,
      {},
    )(master.transport).copy();
    automationClips.push(clip);
    master.elements.add(placed);
  }

  const project = {
    id: i.id,
    bpm: oly.olyRef(i.bpm),
    name: oly.olyRef(i.name),
    stepsPerBeat: oly.olyRef(i.stepsPerBeat),
    beatsPerMeasure: oly.olyRef(i.beatsPerMeasure),
    instruments,
    patterns,
    serialize,
    master,
    samples,
    automationClips,
    tracks,
    channels,
    save,
    addInstrument,
    createAutomationClip,
    deleteInstrument,
    // setChannel,
    // openTempProject,
    // onDidSave,
    // openedFile,
    // saveProject,
    // removeOpenedFile,
    // setOpenedFile,
  } as const;

  return {
    project,
  };
};
