import Tone from 'tone';
import { Disposer } from '@/lib/std';

interface AudioNode {
  disconnect(node: AudioNode): this;
  connect(node: AudioNode): this;
}

export class GraphNode<T extends AudioNode | null = AudioNode | null> {
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

  constructor(public node: T, private name?: string) {}

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

  public connect(newDest?: GraphNode): Disposer {
    const oldDest = this.output;
    GraphNode.doConnect(this, { oldDest, newDest });

    return {
      dispose: () => {
        GraphNode.doConnect(this, { oldDest: newDest, newDest: oldDest });
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
    const inputs = this.inputs.slice();
    inputs.forEach((input) => input.connect(this.output));
    this.connect();

    return {
      dispose: () => {
        this.connect(this.output);
        inputs.forEach((input) => input.connect(this));
      },
    };
  }

  public toString() {
    const getRoot = (node: GraphNode): GraphNode => {
      return node.output ? getRoot(node.output) : node;
    };

    interface Level {
      name: string;
      children?: Level[];
    }

    const generateLevel = (node: GraphNode): Level => {
      const name = node.name ?? 'No Name';
      if (node.inputs.length === 0) {
        return {
          name,
        };
      }

      const level: Level = {
        name,
        children: node.inputs.map((input) => {
          return generateLevel(input);
        }),
      };

      return level;
    };

    const offset = (depth: number, name: string) => {
      return Array(depth + 1).fill('').join('  ') + name;
    };

    const generateString = (level: Level, depth = 0): string => {
      const name = offset(depth, level.name);

      if (!level.children) {
        return name;
      }

      const children = level.children.map((child) => generateString(child, depth + 1));
      if (children.length === 1) {
        return `${name} < ${children[0].trimLeft()}`;
      }

      return name + '\n' + children.join('\n');
    };

    const root = getRoot(this);
    const rootLevel = generateLevel(root);
    return generateString(rootLevel);
  }

  public toMaster() {
    this.connect(masterNode);
    return this;
  }
}

export const masterNode = new GraphNode(Tone.Master, 'Master');
