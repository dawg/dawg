import decode from 'audio-decode';
import ADSR from 'envelope-generator';
import { parseNote } from '@/lib/mutils';

export type SoundfontName =
  | 'accordion'
  | 'acoustic_bass'
  | 'acoustic_grand_piano'
  | 'acoustic_guitar_nylon'
  | 'acoustic_guitar_steel'
  | 'agogo'
  | 'alto_sax'
  | 'applause'
  | 'bagpipe'
  | 'banjo'
  | 'baritone_sax'
  | 'bassoon'
  | 'bird_tweet'
  | 'blown_bottle'
  | 'brass_section'
  | 'breath_noise'
  | 'bright_acoustic_piano'
  | 'celesta'
  | 'cello'
  | 'choir_aahs'
  | 'church_organ'
  | 'clarinet'
  | 'clavinet'
  | 'contrabass'
  | 'distortion_guitar'
  | 'drawbar_organ'
  | 'dulcimer'
  | 'electric_bass_finger'
  | 'electric_bass_pick'
  | 'electric_grand_piano'
  | 'electric_guitar_clean'
  | 'electric_guitar_jazz'
  | 'electric_guitar_muted'
  | 'electric_piano_1'
  | 'electric_piano_2'
  | 'english_horn'
  | 'fiddle'
  | 'flute'
  | 'french_horn'
  | 'fretless_bass'
  | 'fx_1_rain'
  | 'fx_2_soundtrack'
  | 'fx_3_crystal'
  | 'fx_4_atmosphere'
  | 'fx_5_brightness'
  | 'fx_6_goblins'
  | 'fx_7_echoes'
  | 'fx_8_scifi'
  | 'glockenspiel'
  | 'guitar_fret_noise'
  | 'guitar_harmonics'
  | 'gunshot'
  | 'harmonica'
  | 'harpsichord'
  | 'helicopter'
  | 'honkytonk_piano'
  | 'kalimba'
  | 'koto'
  | 'lead_1_square'
  | 'lead_2_sawtooth'
  | 'lead_3_calliope'
  | 'lead_4_chiff'
  | 'lead_5_charang'
  | 'lead_6_voice'
  | 'lead_7_fifths'
  | 'lead_8_bass__lead'
  | 'marimba'
  | 'melodic_tom'
  | 'music_box'
  | 'muted_trumpet'
  | 'oboe'
  | 'ocarina'
  | 'orchestra_hit'
  | 'orchestral_harp'
  | 'overdriven_guitar'
  | 'pad_1_new_age'
  | 'pad_2_warm'
  | 'pad_3_polysynth'
  | 'pad_4_choir'
  | 'pad_5_bowed'
  | 'pad_6_metallic'
  | 'pad_7_halo'
  | 'pad_8_sweep'
  | 'pan_flute'
  | 'percussive_organ'
  | 'piccolo'
  | 'pizzicato_strings'
  | 'recorder'
  | 'reed_organ'
  | 'reverse_cymbal'
  | 'rock_organ'
  | 'seashore'
  | 'shakuhachi'
  | 'shamisen'
  | 'shanai'
  | 'sitar'
  | 'slap_bass_1'
  | 'slap_bass_2'
  | 'soprano_sax'
  | 'steel_drums'
  | 'string_ensemble_1'
  | 'string_ensemble_2'
  | 'synth_bass_1'
  | 'synth_bass_2'
  | 'synth_brass_1'
  | 'synth_brass_2'
  | 'synth_choir'
  | 'synth_drum'
  | 'synth_strings_1'
  | 'synth_strings_2'
  | 'taiko_drum'
  | 'tango_accordion'
  | 'telephone_ring'
  | 'tenor_sax'
  | 'timpani'
  | 'tinkle_bell'
  | 'tremolo_strings'
  | 'trombone'
  | 'trumpet'
  | 'tuba'
  | 'tubular_bells'
  | 'vibraphone'
  | 'viola'
  | 'violin'
  | 'voice_oohs'
  | 'whistle'
  | 'woodblock'
  | 'xylophone';

const EMPTY = {};

interface PlayerOptions {
  cents: number;
}

interface StartOptions {
  duration: number | undefined;
  gain: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

const startDefaults: StartOptions = {
  attack: 0.01,
  decay: 0.1,
  sustain: 0.9,
  release: 0.3,
  gain: 1,
  duration: undefined,
};

const DEFAULTS: PlayerOptions = {
  cents: 0,
};

function SamplePlayer(
  ac: AudioContext, buffers: { [k: string]: AudioBuffer }, options: Partial<PlayerOptions> = {},
) {
  let nextId = 0;
  const out = ac.createGain();
  out.gain.value = 1;

  Object.assign(options, DEFAULTS);

  function start(name: string, when?: number, o: Partial<StartOptions> = {}) {
    const midi = parseNote(name);
    if (midi === undefined) {
      return {
        dispose: () => {
          //
        },
      };
    }

    when = when ?? ac.currentTime;
    o = Object.assign({}, startDefaults, o);

    const buffer = buffers[midi];
    const node = createNode(buffer, o);
    node.env.start(when);
    node.source.start(when);

    if (o.duration) {
      node.stop(when + o.duration);
    }

    return node;
  }

  function connect(dest: AudioNode) {
    out.connect(dest);
  }

  function disconnect(dest: AudioNode) {
    out.disconnect(dest);
  }

  function createNode(buffer: AudioBuffer, o: Partial<StartOptions>) {
    const node = ac.createGain();
    node.gain.value = 0; // the envelope will control the gain
    node.connect(out);

    const env = new ADSR(ac, {
      attackTime: o.attack,
      decayTime: o.decay,
      sustainLevel: o.sustain,
      releaseTime: o.release,
    });

    env.connect(node.gain);

    const source = ac.createBufferSource();
    source.buffer = buffer;
    source.connect(node);
    source.playbackRate.value = centsToRate(options.cents);
    const stop = (when?: number) => {
      const time = when ?? ac.currentTime;

      env.stop(time);
      source.stop(time);
    };

    const id = nextId++;
    source.onended = () => {
      source.disconnect();
      // This api is not provided
      // I'm wondering if this will cause a bug or memory issue
      // env.disconnect();
      node.disconnect();
    };

    return {
      node,
      source,
      env,
      id,
      stop,
      dispose: () => {
        source.stop();
      },
    };
  }

  return {
    out,
    start,
    stop,
    connect,
    disconnect,
  };
}

export type Player = ReturnType<typeof SamplePlayer>;

/*
  * Get playback rate for a given pitch change (in cents)
  * Basic [math](http://www.birdsoft.demon.co.uk/music/samplert.htm):
  * f2 = f1 * 2^( C / 1200 )
  */
function centsToRate(cents?: number) {
  return cents ? Math.pow(2, cents / 1200) : 1;
}

// convert a MIDI.js javascript soundfont file to json
function midiJsToJson(data: string) {
  let begin = data.indexOf('MIDI.Soundfont.');
  if (begin < 0) { throw Error('Invalid MIDI.js Soundfont format'); }
  begin = data.indexOf('=', begin) + 2;
  const end = data.lastIndexOf(',');
  return JSON.parse(data.slice(begin, end) + '}');
}

interface RequestError {
  type: 'error';
  message: string;
}

interface RequestSuccess {
  type: 'success';
  body: string;
}

async function sendRequest(url: string): Promise<RequestError | RequestSuccess> {
  let response;
  try {
    response = await fetch(url);
  } catch (e) {
    return {
      type: 'error',
      message: e.message,
    };
  }

  return {
    type: 'success',
    body: await response.text(),
  };
}

function b64ToUint6(nChr: number) {
  return nChr > 64 && nChr < 91 ? nChr - 65
    : nChr > 96 && nChr < 123 ? nChr - 71
    : nChr > 47 && nChr < 58 ? nChr + 4
    : nChr === 43 ? 62
    : nChr === 47 ? 63
    : 0;
}

// Decode Base64 to Uint8Array
// ---------------------------
function base64Decode(sBase64: string, nBlocksSize?: number) {
  const sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, '');
  const nInLen = sB64Enc.length;
  const nOutLen = nBlocksSize
    // tslint:disable-next-line:no-bitwise
    ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize
    // tslint:disable-next-line:no-bitwise
    : nInLen * 3 + 1 >> 2;
  const taBytes = new Uint8Array(nOutLen);

  for (let nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
    // tslint:disable-next-line:no-bitwise
    nMod4 = nInIdx & 3;
    // tslint:disable-next-line:no-bitwise
    nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
    if (nMod4 === 3 || nInLen - nInIdx === 1) {
      for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
        // tslint:disable-next-line:no-bitwise
        taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
      }
      nUint24 = 0;
    }
  }
  return taBytes;
}


interface Options {
  soundfont: 'FluidR3_GM' | 'MusyngKite';
  format?: 'ogg' | 'mp3';
}


interface SoundfontError {
  type: 'error';
  message: string;
}

interface SoundfontSuccess {
  type: 'success';
  soundfont: Player;
}

export async function instrument(
  ac: AudioContext,
  name: string,
  options: Partial<Options> = {},
): Promise<SoundfontError | SoundfontSuccess> {
  const sf = options.soundfont ?? 'MusyngKite';
  const format = options.format ?? 'mp3';
  const url = 'https://gleitz.github.io/midi-js-soundfonts/' + sf + '/' + name + '-' + format + '.js';
  const response = await sendRequest(url);
  if (response.type === 'error') {
    return response;
  }

  const source: { [k: string]: string } = await midiJsToJson(response.body);

  const buffers: { [k: number]: AudioBuffer } = {};

  try {
    Promise.all(Object.keys(source).map(async (key) => {
      const i = source[key].indexOf(',');
      const note = parseNote(key);
      if (note === undefined) {
        throw Error('Unable to parse note: ' + key);
      }

      buffers[note] = await decode(base64Decode(source[key].slice(i + 1)).buffer);
    }));
  } catch (e) {
    return {
      type: 'error',
      message: e.message,
    };
  }


  // Play doesn't handle cents
  // See https://github.com/danigb/sample-player/blob/master/lib/notes.js

  return {
    type: 'success',
    soundfont: SamplePlayer(ac, buffers),
  };
}
