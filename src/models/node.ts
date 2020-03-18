import * as Audio from '@/lib/audio';
import { Disposer } from '@/lib/std';
import { destination } from '@/models/destination';

interface Input {
  input?: number;
  output?: number;
  node: GraphNode;
}

interface Output {
  input?: number;
  output?: number;
  node: GraphNode;
}

const connect = (a: GraphNode, b: GraphNode, output?: number, input?: number) => {
  if (a.node && b.node) {
    a.node.connect(b.node, output, input);
    return true;
  }
  return false;
};

const disconnect = (a: GraphNode, b: GraphNode, output?: number, input?: number) => {
  if (a.node && b.node) {
    if (input !== undefined && output !== undefined) {
      a.node.disconnect(b.node, output, input);
    } else if (output !== undefined) {
      a.node.disconnect(b.node, output);
    } else {
      a.node.disconnect(b.node);
    }
    return true;
  }
  return false;
};

// TODO refactor ??
export class GraphNode<T extends Audio.ObeoNode | null = Audio.ObeoNode | null> {
  private static doConnect(
    me: GraphNode, o: { oldDest?: Output, newDest?: Output },
  ) {
    if (o.oldDest) {
      const i = o.oldDest.node.inputs.map((input) => input.node).indexOf(me);
      o.oldDest.node.inputs.splice(i, 1);
      if (disconnect(me, o.oldDest.node, o.oldDest.output, o.oldDest.input)) {
        me.connected = false;
      }
    }

    me.output = o.newDest;

    if (o.newDest) {
      o.newDest.node.inputs.push({
        node: me,
        input: o.newDest.input,
        output: o.newDest.output,
      });

      if (connect(me, o.newDest.node, o.newDest.input, o.newDest.output)) {
        me.connected = true;
      }
    }
  }

  private inputs: Input[] = [];
  private output: Output | undefined = undefined;
  private isMuted = false;
  private connected = false;

  constructor(public node: T, private name?: string) {}

  get mute() {
    return this.isMuted;
  }

  set mute(value: boolean) {
    this.isMuted = value;

    if (!this.output || !this.output.node.node || !this.node) {
      return;
    }

    if (this.mute && this.connected) {
      this.node.disconnect(this.output.node.node);
      this.connected = false;
    } else if (!this.mute && !this.connected) {
      this.node.connect(this.output.node.node);
      this.connected = true;
    }
  }

  public connect(node?: GraphNode, input?: number, output?: number): Disposer {
    const newDest = node ? { node, input, output } : undefined;
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
      input.node.connect(node);
    });
  }

  public replace(node: T) {
    this.node = node;

    this.inputs.forEach((input) => {
      input.node.connect(this);
    });

    this.connect(this.output?.node, this.output?.output, this.output?.input);
  }

  public dispose() {
    const inputs = this.inputs.slice();
    inputs.forEach((input) => {
      input.node.connect(this.output?.node, this.output?.input, this.output?.input);
    });

    this.connect();

    return {
      dispose: () => {
        this.connect(this.output?.node, this.output?.output, this.output?.input);
        inputs.forEach((input) => input.node.connect(this));
      },
    };
  }

  public toString() {
    const getRoot = (node: GraphNode): GraphNode => {
      return node.output ? getRoot(node.output.node) : node;
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
          return generateLevel(input.node);
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
    this.connect(destination);
    return this;
  }
}
