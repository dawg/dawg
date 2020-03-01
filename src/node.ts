import Tone from 'tone';
import * as oly from '@/olyger';

interface AudioNode {
  disconnect(node: AudioNode): this;
  connect(node: AudioNode): this;
  toMaster(): this;
}

export class GraphNode<T extends AudioNode | null = AudioNode | null> implements oly.IRecursiveDisposer {
  private inputs: GraphNode[] = [];
  private output: GraphNode | undefined = undefined;
  private isMuted = false;
  private connected = false;

  constructor(public node: T) {}

  get mute() {
    return this.isMuted;
  }

  set mute(value: boolean) {
    this.isMuted = value;

    if (!this.output || !this.output.node || !this.node) {
      return;
    }

    if (this.mute && this.connected) {
      this.node.disconnect(this.output.node);
      this.connected = false;
    } else if (!this.mute && !this.connected) {
      this.node.connect(this.output.node);
      this.connected = true;
    }
  }

  public connect(node?: GraphNode) {
    const local: AudioNode | null = this.node;

    if (this.output) {
      const i = this.output.inputs.indexOf(this);
      this.output.inputs.splice(i, 1);
      if (this.output.node && local) {
        local.disconnect(this.output.node);
        this.connected = false;
      }
    }

    this.output = node;

    if (this.output) {
      this.output.inputs.push(this);
      if (this.output.node && local) {
        local.connect(this.output.node);
        this.connected = true;
      }
    }

    return this;
  }

  public redirect(node: GraphNode<any>) {
    this.inputs.forEach((input) => {
      input.connect(node);
    });
  }

  public replace(node: T) {
    this.node = node;

    this.inputs.forEach((input) => {
      input.connect(this);
    });

    this.connect(this.output);
  }

  public dispose() {
    const dispose = () => {
      this.inputs.forEach((input) => input.connect(this.output));

      return {
        dispose: () => {
          this.inputs.forEach((input) => input.connect(this));

          return {
            dispose,
          };
        },
      };
    };

    return {
      dispose,
    };
  }
}

export const masterNode = new GraphNode(Tone.Master);
