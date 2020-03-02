import Tone from 'tone';
import * as oly from '@/olyger';

interface AudioNode {
  disconnect(node: AudioNode): this;
  connect(node: AudioNode): this;
  toMaster(): this;
}

export class GraphNode<T extends AudioNode | null = AudioNode | null> implements oly.IRecursiveDisposer {
  private static doConnect(me: GraphNode, o: { oldDest?: GraphNode, newDest?: GraphNode }) {
    if (o.oldDest) {
      const i = o.oldDest.inputs.indexOf(me);
      o.oldDest.inputs.splice(i, 1);
      if (o.oldDest.node && me.node) {
        me.node.disconnect(o.oldDest.node);
        me.connected = false;
      }
    }

    me.output = o.newDest;

    if (o.newDest) {
      o.newDest.inputs.push(me);
      if (o.newDest.node && me.node) {
        me.node.connect(o.newDest.node);
        me.connected = true;
      }
    }
  }

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

  public connect(node?: GraphNode): oly.IRecursiveDisposer {
    const forward = () => {
      GraphNode.doConnect(this, { oldDest: this.output, newDest: node });
    };

    const backwards = () => {
      GraphNode.doConnect(this, { oldDest: node, newDest: this.output });
    };

    forward();

    return {
      dispose: () => {
        backwards();

        return {
          dispose: () => {
            forward();
          },
        };
      },
    };

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
        },
      };
    };

    return {
      dispose,
    };
  }
}

export const masterNode = new GraphNode(Tone.Master);
