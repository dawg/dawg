import Tone from 'tone';

export interface Node {
  connect: (node: Tone.AudioNode) => void;
  disconnect: () => void;
}
