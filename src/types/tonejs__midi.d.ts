// These are copied from the generated tonejs types
// The generated ones contain errors :/

declare module '@tonejs/midi' {
    /**
   * Return the index of the element at or before the given property
   * @param {Array} array
   * @param {*} value
   * @param {string} prop
   */
  function search(array: Array<any>, value: any, prop?: string): void;

  /**
   * Does a binary search to insert the note
   * in the correct spot in the array
   * @param  {Array} array
   * @param  {Object} event
   * @param  {string=} prop
   */
  function insert(array: Array<any>, event: any, prop?: string): void;

  /**
   * @typedef ControlChangeEvent
   * @property {number} controllerType
   * @property {number=} value
   * @property {number=} absoluteTime
   */
  type ControlChangeEvent = {
      controllerType: number;
      value?: number;
      absoluteTime?: number;
  };

  /**
   * Represents a control change event
   */
  class ControlChange {
      constructor(event: ControlChangeEvent, header: Header);
      /** @type {number}
       */
      ticks: number;
      /** @type {number}
       */
      value: number;
      /**
       * The controller number
       * @readonly
       * @type {number}
       */
      readonly number: number;
      /**
       * return the common name of the control number if it exists
       * @type {?string}
       * @readonly
       *
       */
      readonly name: string;
      /**
       * The time of the event in seconds
       * @type {number}
       */
      time: number;
  }

  /**
   * Automatically creates an alias for named control values using Proxies
   * @returns {Object}
   */
  function ControlChanges(): any;

  /**
   * @param {Midi} midi
   * @returns {Uint8Array}
   */
  function encode(midi: Midi): Uint8Array;

  /**
   * @typedef TempoEvent
   * @property {number} ticks
   * @property {number} bpm
   * @property {number} [time]
   */
  type TempoEvent = {
      ticks: number;
      bpm: number;
      time?: number;
  };

  /**
   * @typedef TimeSignatureEvent
   * @property {number} ticks
   * @property {number[]} timeSignature
   * @property {number} [measures]
   */
  type TimeSignatureEvent = {
      ticks: number;
      timeSignature: number[];
      measures?: number;
  };

  /** Represents the parsed midi file header
   */
  class Header {
      constructor(midiData?: any);
      /** @type {TempoEvent[]}
       */
      tempos: TempoEvent[];
      /** @type {TimeSignatureEvent[]}
       */
      timeSignatures: TimeSignatureEvent[];
      /** @type {string}
       */
      name: string;
      /** @type {Array}
       */
      meta: Array<any>;
      /**
       * This must be invoked after any changes are made to the tempo array
       * or the timeSignature array for the updated values to be reflected.
       */
      update(): void;
      /**
       * @param {number} ticks
       * @returns {number}
       */
      ticksToSeconds(ticks: number): number;
      /**
       * @param {number} ticks
       * @returns {number}
       */
      ticksToMeasures(ticks: number): number;
      /**
       * The number of ticks per quarter note
       * @type {number}
       * @readonly
       */
      readonly ppq: number;
      /**
       * @param {number} seconds
       * @returns {number}
       */
      secondsToTicks(seconds: number): number;
      /**
       * @returns {Object}
       */
      toJSON(): any;
      /**
       * @param {Object} json
       */
      fromJSON(json: any): void;
  }

  /**
   * Describes the midi instrument of a track
   */
  class Instrument {
      constructor(trackData: Array<any>, track: Track);
      /**@type {number}
       */
      number: number;
      /** @type {string}
       */
      name: string;
      /** @type {string}
       */
      family: string;
      /** @type {boolean}
       */
      percussion: boolean;
      /**
       * @returns {Object}
       */
      toJSON(): any;
      /**
       * @param {Object} json
       */
      fromJSON(json: any): void;
  }

  /**
   * The main midi parsing class
   */
  class Midi {
      constructor(midiArray?: ArrayLike<number> | ArrayBuffer);
      /**
       * Download and parse the MIDI file. Returns a promise
       * which resolves to the generated midi file
       * @param {string} url The url to fetch
       * @returns {Promise<Midi>}
       */
      static fromUrl(url: string): Promise<Midi>;
      /** @type {Header}
       */
      header: Header;
      /** @type {Array<Track>}
       */
      tracks: Track[];
      /**
       * The name of the midi file, taken from the first track
       * @type {string}
       */
      name: string;
      /**
       * The total length of the file in seconds
       * @type {number}
       */
      duration: number;
      /**
       * The total length of the file in ticks
       * @type {number}
       */
      durationTicks: number;
      /**
       * Add a track to the midi file
       * @returns {Track}
       */
      addTrack(): Track;
      /**
       * Encode the midi as a Uint8Array.
       * @returns {Uint8Array}
       */
      toArray(): Uint8Array;
      /**
       * Convert the midi object to JSON.
       * @returns {Object}
       */
      toJSON(): any;
      /**
       * Parse a JSON representation of the object. Will overwrite the current
       * tracks and header.
       * @param {Object} json
       */
      fromJSON(json: any): void;
      /**
       * Clone the entire object midi object
       * @returns {Midi}
       */
      clone(): Midi;
  }

  /**
   * @param {number} midi
   * @returns {string}
   */
  function midiToPitch(midi: number): string;

  /**
   * @param {number} midi
   * @returns {string}
   */
  function midiToPitchClass(midi: number): string;

  /**
   * @param {string} pitch
   * @returns {number}
   */
  function pitchClassToMidi(pitch: string): number;

  /**
   * @type {function}
   */
  var pitchToMidi: (...params: any[]) => any;

  /**
   * @typedef NoteOnEvent
   * @property {number} ticks
   * @property {number} velocity
   * @property {number} midi
   */
  type NoteOnEvent = {
      ticks: number;
      velocity: number;
      midi: number;
  };

  /**
   * @typedef NoteOffEvent
   * @property {number} ticks
   * @property {number} velocity
   */
  type NoteOffEvent = {
      ticks: number;
      velocity: number;
  };

  /**
   * A Note consists of a noteOn and noteOff event
   */
  class Note {
      constructor(noteOn: NoteOnEvent, noteOff: NoteOffEvent, header: Header);
      /**
       * The notes midi value
       * @type {number}
       */
      midi: number;
      /**
       * The normalized velocity (0-1)
       * @type {number}
       */
      velocity: number;
      /**
       * The velocity of the note off
       * @type {number}
       */
      noteOffVelocity: number;
      /**
       * The start time in ticks
       * @type {number}
       */
      ticks: number;
      /**
       * The duration in ticks
       * @type {number}
       */
      durationTicks: number;
      /**
       * The note name and octave in scientific pitch notation, e.g. "C4"
       * @type {string}
       */
      name: string;
      /**
       * The notes octave number
       * @type {number}
       */
      octave: number;
      /**
       * The pitch class name. e.g. "A"
       * @type {string}
       */
      pitch: string;
      /**
       * The duration of the segment in seconds
       * @type {number}
       */
      duration: number;
      /**
       * The time of the event in seconds
       * @type {number}
       */
      time: number;
      /**
       * The number of measures (and partial measures) to this beat.
       * Takes into account time signature changes
       * @type {number}
       * @readonly
       */
      readonly bars: number;
  }

  /**
   * @typedef MidiEvent
   * @property {string} type
   * @property {number=} velocity
   * @property {number} absoluteTime
   * @property {number=} noteNumber
   * @property {string=} text
   * @property {number=} controllerType
   * @property {number} value
   */
  type MidiEvent = {
      type: string;
      velocity?: number;
      absoluteTime: number;
      noteNumber?: number;
      text?: string;
      controllerType?: number;
      value: number;
  };

  /**
   * @typedef {Array<MidiEvent>} TrackData
   */
  type TrackData = MidiEvent[];

  /**
   * A Track is a collection of notes and controlChanges
   */
  class Track {
      constructor(trackData: TrackData, header: Header);
      /** @type {string}
       */
      name: string;
      /** @type {Instrument}
       */
      instrument: Instrument;
      /** @type {Array<Note>}
       */
      notes: Note[];
      /** @type {number}
       */
      channel: number;
      /** @type {Object<string,Array<ControlChange>>}
       */
      controlChanges: {
          [key: string]: ControlChange[];
      };
      /**
       * Add a note to the notes array
       * @param {NoteParameters} props The note properties to add
       * @returns {Track} this
       */
      addNote(props: NoteParameters): Track;
      /**
       * Add a control change to the track
       * @param {CCParameters} props
       * @returns {Track} this
       */
      addCC(props: CCParameters): Track;
      /**
       * The end time of the last event in the track
       * @type {number}
       * @readonly
       */
      readonly duration: number;
      /**
       * The end time of the last event in the track in ticks
       * @type {number}
       * @readonly
       */
      readonly durationTicks: number;
      /**
       * @param {Object} json
       */
      fromJSON(json: any): void;
      /**
       * @returns {Object}
       */
      toJSON(): any;
  }

  /**
   * @typedef NoteParameters
   * @property {number=} time
   * @property {number=} ticks
   * @property {number=} duration
   * @property {number=} durationTicks
   * @property {number=} midi
   * @property {string=} pitch
   * @property {number=} octave
   * @property {string=} name
   * @property {number=} noteOffVelocity
   * @property {number} [velocity=1]
   * @property {number} [channel=1]
   */
  type NoteParameters = {
      time?: number;
      ticks?: number;
      duration?: number;
      durationTicks?: number;
      midi?: number;
      pitch?: string;
      octave?: number;
      name?: string;
      noteOffVelocity?: number;
      velocity?: number;
      channel?: number;
  };

  /**
   * @typedef CCParameters
   * @property {number=} time
   * @property {number=} ticks
   * @property {number} value
   * @property {number} number
   */
  type CCParameters = {
      time?: number;
      ticks?: number;
      value: number;
      number: number;
  };

  export = Midi;
  // export as namespace Midi;

}