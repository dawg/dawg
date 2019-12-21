import tmp from 'tmp';
import uuid from 'uuid';
import fs from '@/fs';
import * as Audio from '@/modules/audio';
import { Beats } from '@/core/types';
import * as t from '@/modules/io';
import { createExtension } from '@/dawg/extensions';
import { remote } from 'electron';
import { loadBufferSync } from '@/modules/wav/local';
import { manager } from '@/base/manager';
import { MemoryLoader } from '@/core/loaders/memory';
import { notify } from '@/dawg/extensions/core/notify';
import { DG_EXTENSION, FILTERS } from '@/constants';
import { commands, Command } from '@/dawg/extensions/core/commands';
import { menubar } from '@/dawg/extensions/core/menubar';
import { computed, ref, watch, Ref } from '@vue/composition-api';
import { patterns as patternsExtension } from '@/dawg/extensions/core/patterns';
import { applicationContext } from '@/dawg/extensions/core/application-context';
import { addEventListener, findUniqueName, makeLookup, range, chain } from '@/utils';
import { log } from '@/dawg/extensions/core/log';
import { emitter } from '@/base/events';
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
} from '@/core';
import Tone from 'tone';

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

const events = emitter<{ save: (encoded: IProject) => void }>();

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
  const projectJSON = manager.getProjectJSON();

  if (!projectJSON) {
    return {
      type: 'success',
      project: emptyProject(),
    };
  }

  const loader = new MemoryLoader(ProjectType, { data: projectJSON });
  const result = loader.load();
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

    // tslint:disable-next-line:variable-name
  const prj = result.project;

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
    prj.patterns.push(pattern);
  }

  async function addInstrument(type: 'Synth' | 'Soundfont') {
    const name = findUniqueName(prj.instruments, type);

    if (type === 'Synth') {
      prj.instruments.push(Synth.create(name));
    } else {
      prj.instruments.push(await Soundfont.create('acoustic_grand_piano', name));
    }
  }

  function removeSample(i: number) {
    if (i >= prj.samples.length) {
      throw Error(`Unable to remove sample ${i}. Out of bounds.`);
    }

    const sample = prj.samples[i];

    // This isn' the best solution but it works
    // There must be a better pattern / object oriented way
    prj.master.elements.forEach((element) => {
      if (!(element instanceof ScheduledSample)) {
        return;
      }

      if (element.sample !== sample) {
        return;
      }

      element.dispose();
    });

    sample.dispose();
    prj.samples.splice(i, 1);
  }

  function removePattern(i: number) {
    if (i >= prj.patterns.length) {
      throw Error(`Unable to pattern sample ${i}. Out of bounds.`);
    }

    const pattern = prj.patterns[i];

    prj.master.elements.forEach((element) => {
      if (!(element instanceof ScheduledPattern)) {
        return;
      }

      if (element.pattern !== pattern) {
        return;
      }

      element.dispose();
    });

    pattern.dispose();
    prj.patterns.splice(i, 1);
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
    pushAutomationClip({ clip, placed });

    return true;
  }

  function pushAutomationClip(payload: { clip: AutomationClip, placed: ScheduledAutomation }) {
    prj.automationClips.push(payload.clip);
    prj.master.elements.push(payload.placed);
    payload.placed.schedule(prj.master.transport);
  }

  function addScore(payload: { pattern: Pattern, instrument: Instrument<any, any>} ) {
    const { pattern } = payload;

    pattern.scores.forEach((score) => {
      if (score.instrumentId === payload.instrument.id) {
        throw Error(`An score already exists for ${payload.instrument.id}`);
      }
    });

    pattern.scores.push(Score.create(pattern.transport, payload.instrument));
  }

  function addSample(payload: Sample) {
    if (prj.samples.indexOf(payload) !== -1) {
      throw Error(`${payload.id} already exists`);
    }

    prj.samples.push(payload);
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
    // instruments could be undefined
    const instruments = instrumentChannelLookup.value[payload.channel.number] || [];

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

  function addEffect(payload: { channel: Channel, effect: EffectName, index: number } ) {
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
    const instruments = instrumentChannelLookup.value[payload.channel.number] || [];

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

  function deleteInstrument(i: number) {
    const instrument = prj.instruments[i];

    prj.patterns.forEach((pattern) => {
      pattern.removeScores((score) => {
        return score.instrument === instrument;
      });
    });

    instrument.dispose();
    prj.instruments.splice(i, 1);
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

    instrument.channel = channel;
    instrument.disconnect();


    let destination: Tone.AudioNode;
    if (channel === undefined) {
      destination = Tone.Master;
    } else {
      const c = prj.channels[channel];
      destination = c.effects.length ? c.effects[0].effect : c.destination;
    }

    instrument.connect(destination);
  }

  function remoteAutomation(i: number) {
    if (i >= prj.automationClips.length) {
      throw Error(`Unable to remove sample ${i}. Out of bounds.`);
    }

    const clip = prj.automationClips[i];

    // This isn' the best solution but it works
    // There must be a better pattern / object oriented way
    prj.master.elements.filter((element) => {
      if (element.component !== 'automation-clip-element') {
        return;
      }

      if (element.clip !== clip) {
        return;
      }

      element.dispose();
    });

    clip.dispose();
    prj.automationClips.splice(i, 1);
  }

  function scheduleMaster(sample: Sample, row: number, time: number) {
    prj.samples.push(sample);

    const scheduled = new ScheduledSample(sample, {
      type: 'sample',
      sampleId: sample.id,
      duration: sample.beats,
      row,
      time,
    });

    scheduled.schedule(prj.master.transport);
    prj.master.elements.push(scheduled);
  }

  const effectLookup = computed(() => {
    const effects = prj.channels.map((channel) => channel.effects);
    const iterable = chain(...effects);
    return makeLookup(iterable);
  });

  const channelLookup = computed(() => {
    return makeLookup(prj.channels);
  });

  return {
    patterns: prj.patterns,
    master: prj.master,
    instruments: prj.instruments,
    samples: prj.samples,
    automationClips: prj.automationClips,
    name: prj.name,
    bpm: prj.bpm,
    serialize,
    save,
    addPattern,
    addInstrument,
    removeSample,
    removePattern,
    createAutomationClip,
    pushAutomationClip,
    addScore,
    addSample,
    remoteAutomation,
    scheduleMaster,
    effectLookup,
    channelLookup,
    deleteInstrument,
    setChannel,
  } as const;
};

const online = (instruments: Array<Instrument<any, any>>) => () => {
  instruments.forEach((instrument) => {
    instrument.online();
  });
};

const extension = createExtension({
  id: 'dawg.project',
  activate(context) {
    // tslint:disable-next-line:variable-name
    const _p = createApi();

    const state = ref<'stopped' | 'started' | 'paused'>('stopped');
    const openedFile = ref(manager.getOpenedFile());
    const logger = log.getLogger();

    context.subscriptions.push(manager.onDidSetOpenedFile(() => {
      openedFile.value = manager.getOpenedFile();
    }));

    const transport = computed(() => {
      if (applicationContext.context.value === 'pianoroll') {
        const pattern = patternsExtension.selectedPattern;
        return pattern.value ? pattern.value.transport : null;
      } else {
        return _p.master.transport;
      }
    });

    function scheduleMaster(sample: Sample, row: number, time: Beats) {
      _p.samples.push(sample);

      const scheduled = new ScheduledSample(sample, {
        type: 'sample',
        sampleId: sample.id,
        duration: sample.beats,
        row,
        time,
      });

      scheduled.schedule(_p.master.transport);
      _p.master.elements.push(scheduled);
    }

    async function openTempProject(p: IProject) {
      const { name: path } = tmp.fileSync({ keep: true });
      await fs.writeFile(path, JSON.stringify(p, null, 4));

      logger.info(`Writing ${path} as backup`);
      manager.setOpenedFile(path, { isTemp: true });

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
      const p = await _p;

      let projectPath = manager.getOpenedFile();
      if (!projectPath || opts.forceDialog) {
        projectPath = remote.dialog.showSaveDialog(remote.getCurrentWindow(), {}) || null;

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
        manager.setOpenedFile(projectPath);
      }

      const encoded = p.serialize();

      await fs.writeFile(projectPath, JSON.stringify(encoded, null, 4));
      events.emit('save', encoded);
    }

    async function removeOpenedFile() {
      await manager.setOpenedFile();
    }

    async function setOpenedFile(path: string) {
      await manager.setOpenedFile(path);
    }

    const api = {
      scheduleMaster,
      openTempProject,
      onDidSave,
      serializeProject: () => _p.serialize(),
      openedFile,
      saveProject,
      removeOpenedFile,
      setOpenedFile,
      playPause() {
        if (!transport.value) {
          notify.warning('Please select a Pattern.', {
            detail: 'Please create and select a `Pattern` first or switch the `Playlist` context.',
          });
          return;
        }

        if (transport.value.state === 'started') {
          api.pause();
        } else {
          api.startTransport();
        }
      },
      pause() {
        if (!transport.value) {
          return;
        }

        transport.value.stop();
        state.value = 'paused';
      },
      getTime() {
        if (!transport.value) {
          return 0;
        }

        return transport.value.seconds;
      },
      startTransport() {
        if (!transport.value) {
          return;
        }

        transport.value.start();
        state.value = 'started';
      },
      stopIfStarted() {
        if (transport.value && transport.value.state === 'started') {
          api.stopTransport();
        }
      },
      stopTransport() {
        if (!transport.value) {
          return;
        }

        transport.value.stop();
        state.value = 'stopped';
      },
      state,
      // TODO
      ..._p,
    } as const;

    context.subscriptions.push(addEventListener('online', online(_p.instruments)));

    // Pause every time the context changes
    watch(applicationContext.context, () => {
      api.pause();
    });

    const save: Command = {
      text: 'Save',
      shortcut: ['CmdOrCtrl', 'S'],
      callback: async () => {
        await api.saveProject({
          forceDialog: false,
        });
      },
    };

    const saveAs: Command = {
      text: 'Save',
      shortcut: ['CmdOrCtrl', 'Shift', 'S'],
      callback: async () => {
        await api.saveProject({
          forceDialog: true,
        });
      },
    };

    const open: Command = {
      text: 'Open',
      shortcut: ['CmdOrCtrl', 'O'],
      callback: async () => {
        // files can be undefined. There is an issue with the .d.ts files.
        const files = remote.dialog.showOpenDialog(
          remote.getCurrentWindow(),
          { filters: FILTERS, properties: ['openFile'] },
        );

        // FIXME
        // the showFileDialog messes with the keyup events
        // This is a temporary solution
        commands.clear();

        if (!files) {
          return;
        }

        const filePath = files[0];
        await api.setOpenedFile(filePath);

        const window = remote.getCurrentWindow();
        window.reload();
      },
    };

    const newProject: Command = {
      shortcut: ['CmdOrCtrl', 'N'],
      text: 'New Project',
      callback: async () => {
        await api.removeOpenedFile();

        const window = remote.getCurrentWindow();
        window.reload();
      },
    };

    const file = menubar.getMenu('File');
    const toDispose = [save, saveAs, open, newProject].map((command) => {
      context.subscriptions.push(commands.registerCommand(command));
      return file.addItem(command);
    });

    context.subscriptions.push(...toDispose);
    context.subscriptions.push(commands.registerCommand({
      text: 'Play/Pause',
      shortcut: ['Space'],
      callback: api.playPause,
    }));

    context.settings.push({
      type: 'string',
      label: 'Project Name',
      description: 'Give your project a better name to make it more identifiable.',
      value: name,
    });

    return api;
  },
});

export const project = manager.activate(extension);
