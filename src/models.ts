export interface Note {
  id: number;
  time: number;
  duration: number;
}

export interface Score {
  name: string;
  instrumentId: string;
  notes: Note[];
}

export interface Pattern {
  name: string;
  scores: Score[];
}

export interface Project {
  bpm: number;
  patterns: Pattern[];
}
