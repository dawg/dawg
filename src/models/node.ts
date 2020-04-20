import * as Audio from '@/lib/audio';
import { Disposer } from '@/lib/std';

interface Connection {
  inputNumber?: number;
  outputNumber?: number;
  input: GraphNode;
  output: GraphNode;
}

// FIXME This Audio.ObeoNode<any, any> is a little type unsafe
export class GraphNode<T extends Audio.ObeoNode<any, any> = Audio.ObeoNode> {
  private static disconnect(connection: Connection) {
    const { output, input, inputNumber, outputNumber } = connection;
    const i = output.inputs.findIndex((maybe) => maybe === connection);
    output.inputs.splice(i, 1);
    input.output = undefined;
    input.node.disconnect(output.node, outputNumber, inputNumber);
  }

  private static connect(connection: Connection) {
    const { output, input, inputNumber, outputNumber } = connection;
    output.inputs.push(connection);
    input.output = connection;
    input.node.connect(output.node, outputNumber, inputNumber);
  }

  private inputs: Connection[] = [];
  private output: Connection | undefined = undefined;
  constructor(public node: T, private name?: string) {}

  public connect(node: GraphNode, output?: number, input?: number): Disposer {
    const newDest: Connection = {
      input: this,
      output: node,
      inputNumber: input,
      outputNumber: output,
    };

    const oldDest = this.output;
    this.doConnect({ oldDest, newDest });

    return {
      dispose: () => {
        this.doConnect({ oldDest: newDest, newDest: oldDest });
      },
    };
  }

  public disconnect() {
    const newDest = undefined;
    const oldDest = this.output;
    this.doConnect({ oldDest, newDest });
    return {
      dispose: () => {
        this.doConnect({ oldDest: newDest, newDest: oldDest });
      },
    };
  }

  public redirect(node: GraphNode) {
    this.inputs.slice().forEach(({ input, inputNumber, outputNumber }) => {
      input.connect(node, outputNumber, inputNumber);
    });
  }

  public outputOf(node: GraphNode) {
    return node.output?.output === this;
  }

  public inputOf(node: GraphNode) {
    return node.inputs.some((input) => input.input === this);
  }

  public replace(node: T) {
    this.inputs.slice().forEach((input) => {
      input.input.node.disconnect(this.node);
      input.input.node.connect(node);
    });

    if (this.output) {
      this.node.disconnect(this.output.output.node);
      node.connect(this.output.output.node);
    }

    this.node = node;
  }

  public dispose() {
    const inputs = this.inputs.slice();
    const outputConnection = this.output;

    if (outputConnection) {
      const { output, inputNumber, outputNumber } = outputConnection;
      inputs.forEach(({ input }) => {
        input.connect(output, outputNumber, inputNumber);
      });
    } else {
      inputs.forEach(({ input }) => {
        input.disconnect();
      });
    }


    this.disconnect();

    return {
      dispose: () => {
        if (outputConnection) {
          const { output, inputNumber, outputNumber } = outputConnection;
          this.connect(output, outputNumber, inputNumber);
        }

        inputs.forEach(({ input, outputNumber, inputNumber }) => {
          input.connect(this, outputNumber, inputNumber);
        });
      },
    };
  }

  public toString() {
    const getRoot = (node: GraphNode): GraphNode => {
      return node.output ? getRoot(node.output.output) : node;
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
          return generateLevel(input.input);
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

  public toDestination() {
    // Doing this instead of `this.node.toDestination()` so that we track the graph
    this.connect(destination);
    return this;
  }

  private doConnect(o: { oldDest?: Connection, newDest?: Connection }) {
    if (o.oldDest) {
      GraphNode.disconnect(o.oldDest);
    }

    this.output = o.newDest;

    if (o.newDest) {
      GraphNode.connect(o.newDest);
    }
  }
}

export const destination = new GraphNode(Audio.getDestination());
