import tmp from 'tmp';
import uuid from 'uuid';
import fs from '@/lib/fs';
import * as Audio from '@/lib/audio';
import * as t from '@/lib/io';
import { createExtension } from '@/lib/framework/extensions';
import { remote } from 'electron';
import { loadBufferSync } from '@/lib/wav';
import * as framework from '@/lib/framework';
import { notify } from '@/core/notify';
import { commands } from '@/core/commands';
import { menubar } from '@/core/menubar';
import { computed, ref, watch, Ref } from '@vue/composition-api';
import { makeLookup, range, chain } from '@/lib/std';
import { findUniqueName } from '@/utils';
import { log } from '@/core/log';
import { addEventListener, emitter } from '@/lib/events';
import {
  Playlist,
  Pattern,
  Channel,
  ScheduledSample,
  Sample,
  Soundfont,
  Synth,
  Track,
  AutomationClip,
  ScheduledAutomation,
  ScheduledPattern,
  Score,
  Effect,
  Automatable,
  ClipContext,
  Instrument,
  PlaylistType,
  ChannelType,
  PatternType,
  TrackType,
  SynthType,
  SoundfontType,
  SampleType,
  EffectName,
  AutomationType,
  AnyEffect,
  PlaylistElements,
  Node,
  Note,
} from '@/models';
import Tone from 'tone';
import * as history from '@/core/project/history';

const DG = 'dg';
const FILTERS = [{ name: 'DAWG Files', extensions: [DG] }];
const DG_EXTENSION = `.${DG}`;

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

interface LoadedProject {
  bpm: Ref<number>;
  stepsPerBeat: number;
  beatsPerMeasure: number;
  name: Ref<string>;
  id: string;
  patterns: Pattern[];
  instruments: Array<Synth | Soundfont>;
  channels: Channel[];
  tracks: Track[];
  master: Playlist;
  samples: Sample[];
  automationClips: AutomationClip[];
}

export interface InitializationError {
  type: 'error';
  message: string;
  project: LoadedProject;
}

export interface InitializationSuccess {
  type: 'success';
  project: LoadedProject;
}

const events = emitter<{ save: [IProject] }>();

/**
 * Loads the project from its basic JSON structure into classes. This step is very important as it links a lot of
 * important audio things that were lost during JSON serialization (e.g. everything needs to be rescheduled).
 */
function load(i: IProject): LoadedProject {
  Audio.Context.BPM.value = i.bpm;

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

  const notFound: string[] = [];
  const samples = (i.samples || []).map((iSample) => {
    let buffer: AudioBuffer | null = null;
    if (fs.existsSync(iSample.path)) {
      buffer = loadBufferSync(iSample.path);
    } else {
      notFound.push(iSample.path);
    }

    return new Sample(buffer, iSample);
  });

  if (notFound.length !== 0) {
    notify.warning(
      `Audio files not found`,
      { detail: notFound.join('\n'), duration: Infinity },
    );
  }

  const instrumentLookup = makeLookup(instruments);
  const channelLookup = makeLookup(channels);
  const tracks = i.tracks.map((iTrack) => new Track(iTrack));

  // I don't like this at all
  // But I can't think of a better way to serialize / deserialize automation clips
  // We should figure out how other DAWs serialize automation clips
  const automationClips = (i.automationClips || []).map((iAutomationClip) => {
    let signal: Audio.Signal;
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
    const transport = new Audio.Transport();
    const scores = (iPattern.scores || []).map((iScore) => {
      if (!(iScore.instrumentId in instrumentLookup)) {
        throw Error(`Instrument from score ${iScore.id} was not found in instrument list.`);
      }

      const instrument = instrumentLookup[iScore.instrumentId];
      return new Score(transport, instrument, iScore);
    });

    const pattern = new Pattern(iPattern, transport, scores);
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

  return {
    bpm: ref(i.bpm),
    id: i.id,
    stepsPerBeat: i.stepsPerBeat || 4,
    beatsPerMeasure: i.beatsPerMeasure || 4,
    name: ref(i.name),
    patterns,
    instruments,
    channels,
    tracks,
    samples,
    automationClips,
    master,
  };
}

function emptyProject(): LoadedProject {
  return {
    id: uuid.v4(),
    bpm: ref(120),
    stepsPerBeat: 4,
    beatsPerMeasure: 4,
    name: ref(''),
    master: new Playlist([]),
    patterns: [Pattern.create('Pattern 0')],
    instruments: [Synth.create('Synth 0')],
    channels: range(10).map((index) => Channel.create(index)),
    tracks: range(21).map((index) => Track.create(index)),
    samples: [],
    automationClips: [],
  };
}


function loadProject(): InitializationError | InitializationSuccess {
  const projectJSON = framework.manager.getProjectJSON();

  if (!projectJSON) {
    return {
      type: 'success',
      project: emptyProject(),
    };
  }

  const result = t.decodeItem(ProjectType, projectJSON);
  if (result.type === 'error') {
    return {
      type: 'error',
      message: result.message,
      project: emptyProject(),
    };
  }

  return {
    type: 'success',
    project: load(result.decoded),
  };
}

const createApi = () => {
  const result = loadProject();
  if (result.type === 'error') {
    notify.info('Unable to load project.', { detail: result.message, duration: Infinity });
  }

  const prj = result.project;
  const openedFile = ref(framework.manager.getOpenedFile());
  const logger = log.getLogger();

  async function openTempProject(p: IProject) {
    const { name: path } = tmp.fileSync({ keep: true });
    await fs.writeFile(path, JSON.stringify(p, null, 4));

    logger.info(`Writing ${path} as backup`);
    framework.manager.setOpenedFile(path, { isTemp: true });

    const window = remote.getCurrentWindow();
    window.reload();
  }

  function onDidSave(cb: (encoded: IProject) => void) {
    events.addListener('save', cb);
    return {
      dispose() {
        events.removeListener('save', cb);
      },
    };
  }

  async function saveProject(opts: { forceDialog?: boolean }) {
    const p = await prj;

    let projectPath = framework.manager.getOpenedFile();
    if (!projectPath || opts.forceDialog) {
      const saveDialogReturn = await remote.dialog.showSaveDialog(remote.getCurrentWindow(), {});
      projectPath = saveDialogReturn.filePath || null;


      // If the user cancels the dialog
      if (!projectPath) {
        return;
      }

      if (!projectPath.endsWith(DG_EXTENSION)) {
        logger.info(`Adding ${DG_EXTENSION} to project path`);
        projectPath = projectPath + DG_EXTENSION;
      }

      // Make sure we set the cache and the general
      // The cache is what is written to the filesystem
      // and the general is the file that is currently opened
      logger.info(`Setting opened project as ${projectPath}`);
      framework.manager.setOpenedFile(projectPath);
    }

    const encoded = serialize();
    await fs.writeFile(projectPath, JSON.stringify(encoded, null, 4));
    events.emit('save', encoded);
  }

  async function removeOpenedFile() {
    await framework.manager.setOpenedFile();
  }

  async function setOpenedFile(path: string) {
    await framework.manager.setOpenedFile(path);
  }

  function serialize(): IProject {
    return {
      id: prj.id,
      bpm: prj.bpm.value,
      stepsPerBeat: prj.stepsPerBeat,
      beatsPerMeasure: prj.beatsPerMeasure,
      name: prj.name.value,
      patterns: prj.patterns.map((pattern) => pattern.serialize()),
      instruments: prj.instruments.map((instrument) => instrument.serialize()),
      channels: prj.channels.map((channel) => channel.serialize()),
      tracks: prj.tracks.map((track) => track.serialize()),
      samples: prj.samples.map((sample) => sample.serialize()),
      automationClips: prj.automationClips.map((clip) => clip.serialize()),
      master: prj.master.serialize(),
    };
  }

  async function save(path: string) {
    const encoded = serialize();
    await fs.writeFile(path, JSON.stringify(encoded, null, 4));
  }

  function addPattern() {
    const name = findUniqueName(prj.patterns, 'Pattern');
    const pattern = Pattern.create(name);

    history.execute({
      execute: () => prj.patterns.push(pattern),
      undo: () => prj.patterns.pop(),
    });
  }

  async function addInstrument(type: 'Synth' | 'Soundfont') {
    const name = findUniqueName(prj.instruments, type);
    const instrument = type === 'Soundfont' ?
      Synth.create(name) :
      await Soundfont.create('acoustic_grand_piano', name);

    history.execute({
      execute: () => prj.instruments.push(instrument),
      undo: () => prj.instruments.pop(),
    });
  }

  function removeSample(i: number) {
    if (i >= prj.samples.length) {
      return;
    }

    const sample = prj.samples[i];

    let elements: ScheduledSample[] = [];
    history.execute({
      execute: () => {
        const isSampleElement = (element: PlaylistElements): element is ScheduledSample => {
          return element.component === 'sample-element';
        };

        // This isn' the best solution but it works
        // There must be a better pattern / object oriented way
        elements = prj.master.elements.filter(isSampleElement).filter((element) => {
          return element.sample === sample;
        });

        elements.forEach((element) => {
          element.dispose();
        });

        prj.samples.splice(i, 1);
      },
      undo: () => {
        elements.forEach((element) => prj.master.elements.add(element));
        prj.samples.splice(i, 0, sample);
      },
    });
  }

  function removePattern(i: number) {
    if (i >= prj.patterns.length) {
      throw Error(`Unable to pattern sample ${i}. Out of bounds.`);
    }

    const pattern = prj.patterns[i];

    let elements: ScheduledPattern[] = [];
    history.execute({
      execute: () => {
        const isPatternElement = (element: PlaylistElements): element is ScheduledPattern => {
          return element.component === 'pattern-element';
        };

        elements = prj.master.elements.filter(isPatternElement).filter((element) => {
          return element.pattern === pattern;
        });

        elements.forEach((element) => element.dispose());
        pattern.dispose();
        prj.patterns.splice(i, 1);
      },
      undo: () => {
        elements.forEach((element) => prj.master.elements.add(element));
        prj.patterns.splice(i, 0, pattern);
      },
    });
  }

  function createAutomationClip<T extends Automatable>(
    payload: { automatable: T, key: keyof T & string, end: number, start: number },
  ) {
    const { start, end, key, automatable } = payload;
    const signal = automatable[key] as any as Audio.Signal;


    const available: boolean[] = Array(prj.tracks.length).fill(true);
    prj.master.elements.forEach((element) => {
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
    prj.automationClips.push(clip);
    prj.master.elements.add(placed);
    placed.schedule(prj.master.transport);
    return true;
  }

  function addScore({ pattern, instrument }: { pattern: Pattern, instrument: Instrument<any, any>} ) {
    const score = Score.create(pattern.transport, instrument);
    history.execute({
      execute: () => {
        pattern.scores.push(score);
      },
      undo: () => {
        pattern.scores.pop();
      },
    });
  }

  function addSample(payload: Sample) {
    history.execute({
      execute: () => prj.samples.push(payload),
      undo: () => prj.samples.pop(),
    });
  }

  const instrumentChannelLookup = computed(() => {
    const lookup: { [k: number]: Array<Instrument<any, any>> } = {};
    prj.instruments.forEach((instrument) => {
      if (instrument.channel !== undefined) {
        if (!(instrument.channel in lookup)) {
          lookup[instrument.channel] = [];
        }

        lookup[instrument.channel].push(instrument);
      }
    });
    return lookup;
  });

  function deleteEffect(payload: { channel: Channel, effect: AnyEffect }) {
    const instruments = instrumentChannelLookup.value[payload.channel.number] || [];
    const effects = payload.channel.effects;
    const i = effects.indexOf(payload.effect);
    if (i === -1) {
      return;
    }

    const destination = (effects[i + 1] || {}).effect || payload.channel.destination;
    const inputs: Node[] = [];
    if (i === 0) {
      inputs.push(...instruments);
    } else {
      inputs.push(effects[i - 1]);
    }

    history.execute({
      execute: () => {
        inputs.forEach((input) => input.disconnect());
        inputs.forEach((input) => input.connect(destination));
        effects.splice(i, 1);
      },
      undo: () => {
        inputs.forEach((input) => input.disconnect());
        inputs.forEach((input) => input.connect(payload.effect.effect));
        effects.splice(i, 0, payload.effect);
      },
    });
  }

  function addEffect(payload: { channel: Channel, effect: EffectName, index: number } ) {
    const effects = payload.channel.effects;
    let toInsert: number;
    for (toInsert = 0; toInsert < effects.length; toInsert++) {
      const effect = effects[toInsert];
      if (effect.slot === payload.index) {
        // An effect already exists in the slot
        return;
      }

      if (effect.slot > payload.index) {
        break;
      }
    }

    // Instruments could be undefined if no instruments have been routed to this channel yet.
    const instruments = instrumentChannelLookup.value[payload.channel.number] || [];

    let destination: Tone.AudioNode;
    if (toInsert === effects.length) {
      destination = payload.channel.destination;
    } else {
      destination = effects[toInsert].effect;
    }

    const inputs: Node[] = [];
    if (toInsert === 0) {
      inputs.push(...instruments);
    } else {
      inputs.push(effects[toInsert - 1]);
    }

    const newEffect = Effect.create(payload.index, payload.effect);
    newEffect.connect(destination);

    history.execute({
      execute: () => {
        inputs.forEach((input) => input.disconnect());
        inputs.forEach((input) => input.connect(newEffect.effect));
        effects.splice(toInsert, 0, newEffect);
      },
      undo: () => {
        inputs.forEach((input) => input.disconnect());
        inputs.forEach((input) => input.connect(destination));
        effects.splice(toInsert, 1);
      },
    });
  }

  function deleteInstrument(i: number) {
    const instrument = prj.instruments[i];
    const deleted: Array<{
      pattern: Pattern,
      remaining: Score[],
      removed: Array<{ score: Score, notes: Note[] }>,
    }> = [];

    prj.patterns.forEach((pattern) => {
      const remaining: Score[] = [];
      const removed: Array<{ score: Score, notes: Note[] }> = [];

      pattern.scores.forEach((score) => {
        if (score.instrument === instrument) {
          removed.push({ score, notes: score.notes.elements });
        } else {
          remaining.push(score);
        }
      });

      deleted.push({ pattern, remaining, removed });
    });

    history.execute({
      execute: () => {
        deleted.forEach(({ pattern, remaining, removed }) => {
          removed.forEach(({ score }) => score.dispose());
          pattern.scores = remaining;
        });
        prj.instruments.splice(i, 1);
      },
      undo: () => {
        deleted.forEach(({ pattern, remaining, removed }) => {
          // So notes are removed during the `dispose` call
          // We need to add them back (ie. show them visually and schedule them)
          removed.forEach(({ score, notes }) => score.notes.add(...notes));
          pattern.scores = [...remaining, ...removed.map(({ score }) => score)];
        });
        prj.instruments.splice(i, 0, instrument);
      },
    });

  }

  /**
   * Sets the channel of the instrument to the given channel.
   */
  function setChannel(payload: { instrument: Instrument<any, any>, channel?: number }) {
    const instrument = payload.instrument;
    const channel = payload.channel;
    if (instrument.channel === channel) {
      return;
    }

    let destination: Tone.AudioNode;
    if (channel === undefined) {
      destination = Tone.Master;
    } else {
      const c = prj.channels[channel];
      destination = c.effects.length ? c.effects[0].effect : c.destination;
    }

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
  }

  function removeAutomation(i: number) {
    const clip = prj.automationClips[i];

    const isAutomationElement = (element: PlaylistElements): element is ScheduledAutomation => {
      return element.component === 'automation-clip-element';
    };

    // This isn' the best solution but it works
    // There must be a better pattern / object oriented way
    const elements = prj.master.elements.filter(isAutomationElement).filter((element) => element.clip === clip);

    history.execute({
      execute: () => {
        elements.forEach((element) => element.dispose());
        prj.automationClips.splice(i, 1);
      },
      undo: () => {
        elements.forEach((element) => prj.master.elements.add(element));
        prj.automationClips.splice(i, 0, clip);
      },
    });
  }

  const effectLookup = computed(() => {
    const effects = prj.channels.map((channel) => channel.effects);
    const iterable = chain(...effects);
    return makeLookup(iterable);
  });

  const channelLookup = computed(() => {
    return makeLookup(prj.channels);
  });

  watch(prj.bpm, () => {
    Audio.Context.BPM.value = prj.bpm.value;
  });

  return {
    patterns: prj.patterns,
    master: prj.master,
    instruments: prj.instruments,
    samples: prj.samples,
    automationClips: prj.automationClips,
    tracks: prj.tracks,
    name: prj.name,
    bpm: prj.bpm,
    channels: prj.channels,
    beatsPerMeasure: prj.beatsPerMeasure,
    stepsPerBeat: prj.stepsPerBeat,
    serialize,
    save,
    addPattern,
    deleteEffect,
    addEffect,
    addInstrument,
    removeSample,
    removePattern,
    createAutomationClip,
    addScore,
    addSample,
    removeAutomation,
    effectLookup,
    channelLookup,
    deleteInstrument,
    setChannel,
    openTempProject,
    onDidSave,
    openedFile,
    saveProject,
    removeOpenedFile,
    setOpenedFile,
  } as const;
};

const extension = createExtension({
  id: 'dawg.project',
  activate(context) {
    const api = createApi();

    context.subscriptions.push(framework.manager.onDidSetOpenedFile(() => {
      api.openedFile.value = framework.manager.getOpenedFile();
    }));

    context.subscriptions.push(addEventListener('online', () => {
      api.instruments.forEach((instrument) => {
        instrument.online();
      });
    }));

    const save: framework.Command = {
      text: 'Save',
      shortcut: ['CmdOrCtrl', 'S'],
      callback: async () => {
        await api.saveProject({
          forceDialog: false,
        });
      },
    };

    const saveAs: framework.Command = {
      text: 'Save',
      shortcut: ['CmdOrCtrl', 'Shift', 'S'],
      callback: async () => {
        await api.saveProject({
          forceDialog: true,
        });
      },
    };

    const open: framework.Command = {
      text: 'Open',
      shortcut: ['CmdOrCtrl', 'O'],
      callback: async () => {
        // files can be undefined. There is an issue with the .d.ts files.
        const files = await remote.dialog.showOpenDialog(
          remote.getCurrentWindow(),
          { filters: FILTERS, properties: ['openFile'] },
        );


        if (!files.filePaths || files.filePaths.length === 0) {
          return;
        }

        const filePath = files.filePaths[0];
        await api.setOpenedFile(filePath);

        const window = remote.getCurrentWindow();
        window.reload();
      },
    };

    const newProject: framework.Command = {
      shortcut: ['CmdOrCtrl', 'N'],
      text: 'New Project',
      callback: async () => {
        await api.removeOpenedFile();

        const window = remote.getCurrentWindow();
        window.reload();
      },
    };

    const undo: framework.Command = {
      shortcut: ['CmdOrCtrl', 'Z'],
      text: 'Undo',
      callback: () => {
        history.undo();
      },
    };

    const redo: framework.Command = {
      shortcut: ['CmdOrCtrl', 'Shift', 'Z'],
      text: 'Redo',
      callback: () => {
        history.redo();
      },
    };

    const file = menubar.getMenu('File');
    const toDispose = [save, saveAs, open, newProject].map((command) => {
      context.subscriptions.push(commands.registerCommand(command));
      return file.addItem(command);
    });

    const edit = menubar.getMenu('Edit');
    ([undo, redo]).map((command) => {
      context.subscriptions.push(commands.registerCommand(command));
      context.subscriptions.push(edit.addItem(command));
    });

    context.subscriptions.push(...toDispose);

    context.settings.push({
      type: 'string',
      label: 'Project Name',
      description: 'Give your project a better name to make it more identifiable.',
      value: api.name,
    });

    return api;
  },
});

export const project = framework.manager.activate(extension);
